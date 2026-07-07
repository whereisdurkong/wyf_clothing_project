var express = require('express');
const router = express.Router();
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('../supabase');

// ---- AfterShip tracking (J&T Express Philippines) ----------------------
// AFTERSHIP_API_KEY must be set in your .env file. Get it from
// https://www.aftership.com -> Settings -> API keys. Never expose this
// key to the frontend directly.
const AFTERSHIP_BASE = 'https://api.aftership.com/tracking/2026-01';
const JTEX_PH_SLUG = 'jtexpress-ph';

function afterShipHeaders() {
    const apiKey = process.env.AFTERSHIP_API_KEY;
    if (!apiKey) {
        throw new Error('AFTERSHIP_API_KEY is not set in environment variables');
    }
    return {
        'as-api-key': apiKey,
        'Content-Type': 'application/json',
    };
}

function normalizeTracking(tracking) {
    if (!tracking) return null;
    const checkpoints = (tracking.checkpoints || []).map((c) => ({
        message: c.message || c.tag,
        location: c.location || c.city || c.country_name || null,
        time: c.checkpoint_time,
        tag: c.tag,
    }));
    return {
        trackingNumber: tracking.tracking_number,
        status: tracking.tag, // Pending, InTransit, OutForDelivery, Delivered, Exception
        subStatus: tracking.subtag_message || null,
        estimatedDelivery: tracking.expected_delivery || null,
        checkpoints,
    };
}

// Looks up an existing AfterShip tracking, registering it first if AfterShip
// hasn't seen this tracking number yet.
async function fetchAfterShipTracking(trackingNumber) {
    const headers = afterShipHeaders();

    const getUrl = `${AFTERSHIP_BASE}/trackings/${JTEX_PH_SLUG}/${encodeURIComponent(trackingNumber)}`;
    let response = await fetch(getUrl, { headers });

    if (response.status === 404) {
        const createUrl = `${AFTERSHIP_BASE}/trackings`;
        const createRes = await fetch(createUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                slug: JTEX_PH_SLUG,
                tracking_number: trackingNumber,
            }),
        });

        if (!createRes.ok) {
            const errBody = await createRes.json().catch(() => ({}));

            // AfterShip's write can lag slightly behind reads, so our earlier
            // GET can 404 even when the tracking was already created (e.g.
            // by a previous request for the same number). If that's what
            // happened, AfterShip conveniently hands us the tracking's id
            // in the error body — fetch it directly instead of failing.
            if (errBody?.meta?.code === 4003 && errBody?.data?.id) {
                const byIdRes = await fetch(
                    `${AFTERSHIP_BASE}/trackings/${errBody.data.id}`,
                    { headers }
                );
                if (byIdRes.ok) {
                    const byIdData = await byIdRes.json();
                    return normalizeTracking(byIdData?.data);
                }
            }

            const err = new Error('Could not register tracking with AfterShip.');
            err.status = createRes.status;
            err.detail = errBody;
            throw err;
        }

        const createData = await createRes.json();
        return normalizeTracking(createData?.data?.tracking);
    }

    if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const err = new Error('AfterShip lookup failed.');
        err.status = response.status;
        err.detail = errBody;
        throw err;
    }

    const data = await response.json();
    return normalizeTracking(data?.data?.tracking);
}

router.get('/get-all-orders', async (req, res, next) => {
    try {
        const { data, error } = await supabase.from('order_master').select('*');

        if (error) {
            return res.status(500).json({ error: 'Unable to get all orders' });
        }
        res.json(data)
    } catch (err) {
        console.log('Unable to get all orders', err);
    }
})

router.get('/get-order-by-id', async (req, res, next) => {
    try {

        const { data, error } = await supabase.from('order_master').select('*').eq('order_id', req.query.id).single();

        if (error) {
            console.log('SUPABASE ERROR:', error);
            return res.status(500).json({ error: 'Unable to get order by id', detail: error.message });
        }
        res.json(data)
    } catch (err) {
        console.log('UNEXPECTED ERROR:', err);
        res.status(500).json({ error: 'Unexpected server error', detail: err.message });
    }
})

router.post('/update-status', async (req, res, next) => {
    try {
        const { order_id, order_status } = req.body;

        await supabase.from('order_master').update({
            order_status: order_status
        }).eq('order_id', order_id);

        return res.status(200).json({
            message: 'Order updated successfully.',
        });

    } catch (err) {
        console.log('Unable to update-status: ', err)
    }
})

router.post('/update-tracking', async (req, res, next) => {
    try {
        const { tracking_number, order_id } = req.body;

        await supabase.from('order_master').update({
            tracking_number: tracking_number
        }).eq('order_id', order_id)

        return res.status(200).json({
            message: 'Tracking number saved successfully.',
        });
    } catch (err) {
        console.log('UNABLE TO SAVE TRACKING NUMBER: ', err)
        res.status(500).json({ error: 'Unable to save tracking number', detail: err.message });
    }
});

router.post('/update-status-to-receive', async (req, res, next) => {
    try {
        const { order_id } = req.body;

        await supabase.from('order_master').update({
            order_status: 'to_receive'
        }).eq('order_id', order_id)

        return res.status(200).json({
            message: 'Order status updated successfully.',
        });
    } catch (err) {
        console.log('UNABLE TO UPDATE ORDER STATUS: ', err)
        res.status(500).json({ error: 'Unable to update order status', detail: err.message });
    }
})

// POST /create-review
// Saves a customer's post-delivery review for an order: a required star
// rating (0-5 inclusive) plus an optional free-text description.
// Body: { order_id, rating, description }
router.post('/create-review', async (req, res, next) => {
    try {
        const { order_id, rating, description } = req.body;

        if (!order_id) {
            return res.status(400).json({ error: 'Missing order_id' });
        }

        if (rating === undefined || rating === null || rating === '') {
            return res.status(400).json({ error: 'Rating is required' });
        }

        const numericRating = Number(rating);
        if (Number.isNaN(numericRating) || !Number.isInteger(numericRating) || numericRating < 0 || numericRating > 5) {
            return res.status(400).json({ error: 'Rating must be a whole number between 0 and 5' });
        }

        // Make sure the order actually exists before attaching a review to it.
        // const { data: order, error: orderError } = await supabase
        //     .from('order_master')
        //     .select('order_id')
        //     .eq('order_id', order_id)
        //     .single();

        // if (orderError || !order) {
        //     console.log('SUPABASE ERROR (order lookup):', orderError);
        //     return res.status(404).json({ error: 'Order not found' });
        // }

        const { data, error } = await supabase
            .from('order_master')
            .update({

                is_reviewed: true,
                rating: numericRating,
                description: description ? String(description).trim() : null,
            })
            .eq('order_id', order_id)
            .select()


        if (error) {
            console.log('SUPABASE ERROR (create review):', error);
            return res.status(500).json({ error: 'Unable to create review', detail: error.message });
        }

        return res.status(200).json({
            message: 'Review submitted successfully.',
            review: data,
        });
    } catch (err) {
        console.log('UNABLE TO CREATE REVIEW: ', err);
        res.status(500).json({ error: 'Unable to create review', detail: err.message });
    }
})

// GET /get-review-by-order-id?id=<order_id>
// Returns the review for an order, if one has been submitted.
router.get('/get-review-by-order-id', async (req, res, next) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: 'Missing order id' });
        }

        const { data, error } = await supabase
            .from('order_reviews')
            .select('*')
            .eq('order_id', id)
            .maybeSingle();

        if (error) {
            console.log('SUPABASE ERROR (get review):', error);
            return res.status(500).json({ error: 'Unable to get review', detail: error.message });
        }

        res.json(data || null);
    } catch (err) {
        console.log('UNABLE TO GET REVIEW: ', err);
        res.status(500).json({ error: 'Unable to get review', detail: err.message });
    }
})

// GET /get-tracking-status?id=<order_id>
// Looks up the order's saved tracking_number, then pulls live status
// and checkpoints from AfterShip (J&T Express Philippines).
router.get('/get-tracking-status', async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ error: 'Missing order id' });
        }

        const { data: order, error } = await supabase
            .from('order_master')
            .select('tracking_number')
            .eq('order_id', id)
            .single();

        if (error || !order) {
            console.log('SUPABASE ERROR:', error);
            return res.status(404).json({ error: 'Order not found' });
        }

        if (!order.tracking_number) {
            return res.status(400).json({ error: 'No tracking number saved for this order yet' });
        }

        const tracking = await fetchAfterShipTracking(order.tracking_number);
        res.json(tracking);
    } catch (err) {
        console.log('UNABLE TO GET TRACKING STATUS: ', err);
        res.status(err.status || 500).json({
            error: 'Unable to get tracking status',
            detail: err.detail || err.message,
        });
    }
})

// GET /get-tracking-status-by-number?number=<tracking_number>
// Same as above but for cases where you have a raw tracking number and
// no order_id on hand yet (e.g. testing, or a manual lookup tool).
router.get('/get-tracking-status-by-number', async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try {
        const { number } = req.query;
        if (!number || number.trim().length < 6) {
            return res.status(400).json({ error: 'Invalid tracking number' });
        }

        const tracking = await fetchAfterShipTracking(number.trim());
        res.json(tracking);
    } catch (err) {
        console.log('UNABLE TO GET TRACKING STATUS: ', err);
        res.status(err.status || 500).json({
            error: 'Unable to get tracking status',
            detail: err.detail || err.message,
        });
    }
})

module.exports = router;