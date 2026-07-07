var express = require('express');
const router = express.Router();
const supabase = require('../supabase');
require('dotenv').config();

router.post('/register', async function (req, res) {
    const { name, email } = req.body;

    if (!name || !email) return res.status(400).json({ msg: 'All fields are required' });

    try {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                data: { name, role: 'user' }   // stored in user_metadata, retrieved on /verify
            }
        });

        if (error) throw error;

        res.status(200).json({ message: 'Check your email to confirm your account.' });
    } catch (err) {
        console.error('REGISTER ERROR:', err);
        res.status(500).json({ msg: 'Unable to send verification email' });
    }
});

router.post('/register-admin', async function (req, res) {
    const { name, email, role } = req.body;

    if (!name || !email || !role) return res.status(400).json({ msg: 'All fields are required' });

    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ msg: 'Invalid role' });
    }

    try {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true,
                data: { name, role }   // stored in user_metadata, retrieved on /verify
            }
        });

        if (error) throw error;

        res.status(200).json({ message: 'Check your email to confirm your account.' });
    } catch (err) {
        console.error('REGISTER ERROR:', err);
        res.status(500).json({ msg: 'Unable to send verification email' });
    }
});


// // Login
// router.post('/login', async function (req, res) {
//     const { email, password } = req.body;

//     try {
//         const { data, error } = await supabase.auth.signInWithPassword({
//             email,
//             password
//         });

//         if (error) {
//             if (error.message.includes('Invalid login')) {
//                 return res.status(401).json({ msg: 'Incorrect email or password.' });
//             }
//             throw error;
//         }

//         res.json({
//             message: 'Login successful',
//             user: data.user,
//             access_token: data.session.access_token
//         });
//     } catch (err) {
//         console.log('ERROR LOGGING IN: ', err);
//         res.status(500).json({ msg: 'Login failed' });
//     }
// });

// Get all users
router.get('/get-all-users', async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('id, name, email, role, created_at');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ msg: 'Unable to fetch users' });
    }
});

// Get user by id
router.get('/get-by-id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.query.id)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.log('INTERNAL ERROR: ', err);
        res.status(500).json({ msg: 'Unable to fetch user' });
    }
});


router.post('/login', async function (req, res) {
    const { email } = req.body;

    if (!email) return res.status(400).json({ msg: 'Email is required' });

    try {
        // Check if user exists in your users table first
        const { data: existingUser, error: lookupError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();


        console.log('LOOKUP RESULT:', { existingUser, lookupError });

        if (lookupError || !existingUser) {
            return res.status(404).json({ msg: 'No account found with that email. Please register first.' });
        }

        // User exists — send the magic link
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false }
        });

        if (error) throw error;

        res.json({ message: 'Magic link sent! Check your email.' });
    } catch (err) {
        console.error('LOGIN ERROR:', err);
        res.status(500).json({ msg: 'Failed to send magic link' });
    }
});

router.post('/verify', async function (req, res) {
    const { email, token } = req.body;
    console.log('VERIFY HIT:', { email, token }); // check this appears in logs

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'magiclink'
        });

        console.log('OTP RESULT:', { data, error }); // check what comes back

        if (error) throw error;

        const upsertPayload = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name ?? '',
            role: data.user.user_metadata?.role ?? 'user',
            created_at: new Date().toISOString()
        };

        console.log('UPSERTING:', upsertPayload); // check this matches your columns

        const { data: dbData, error: dbError } = await supabase
            .from('users')
            .upsert(upsertPayload, { onConflict: 'id' });

        console.log('UPSERT RESULT:', { dbData, dbError }); // this will show the real error

        if (dbError) throw dbError;

        res.json({
            message: 'Email verified! Account created.',
            user: data.user,
            access_token: data.session.access_token

        });
    } catch (err) {
        console.error('VERIFY ERROR:', err);
        res.status(500).json({ msg: 'Invalid or expired token', detail: err.message });
    }
});

router.post('/refresh', async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ msg: 'No refresh token provided' });

    try {
        const { data, error } = await supabase.auth.refreshSession({ refresh_token });
        if (error || !data.session) {
            return res.status(401).json({ msg: 'Session expired, please log in again' });
        }

        res.json({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token // Supabase rotates this, save the new one
        });
    } catch (err) {
        console.error('REFRESH ERROR:', err);
        res.status(401).json({ msg: 'Unable to refresh session' });
    }
});

router.post('/save-user', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'No token' });

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) throw userError;

        const { error } = await supabase
            .from('users')
            .upsert({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name ?? '',
                role: user.user_metadata?.role ?? 'user',
                created_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) throw error;

        res.json({ message: 'User saved', user }); // now returns user
    } catch (err) {
        console.error('SAVE USER ERROR:', err);
        res.status(500).json({ msg: err.message });
    }
});

router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'No token' });

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) return res.status(401).json({ msg: 'Invalid or expired token' });

        res.json({ user });
    } catch (err) {
        res.status(401).json({ msg: 'Invalid token' });
    }
});

const nodemailer = require("nodemailer");

router.get('/test-email', async (req, res, next) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'galinatoadrian34@gmail.com',
                pass: 'rnhjickkvxogqpwr'
            }
        });

        const info = await transporter.sendMail({
            from: 'galinatoadrian34@gmail.com',
            to: 'venturaadrian999@gmail.com',
            subject: 'Test Email',
            text: 'This is a test email from the server.'
        });

        console.log('Email sent: ', info.messageId);
        res.json({ success: true, messageId: info.messageId });
    } catch (err) {
        console.log('UNABLE INTERNAL EMAIL SEND: ', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/update-profile', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'No token' });

    const { name, email, role } = req.body;
    console.log('UPDATE PROFILE BODY:', req.body); // ADD THIS

    if (role && !['user', 'admin'].includes(role)) {
        return res.status(400).json({ msg: 'Invalid role' });
    }

    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) return res.status(401).json({ msg: 'Invalid or expired token' });

        const authUpdate = { user_metadata: { ...user.user_metadata } };
        if (name) authUpdate.user_metadata.name = name;
        if (role) authUpdate.user_metadata.role = role;
        if (email && email !== user.email) authUpdate.email = email;

        console.log('AUTH UPDATE PAYLOAD:', authUpdate); // ADD THIS

        const { data: authData, error: authUpdateError } = await supabase.auth.admin.updateUserById(user.id, authUpdate);
        console.log('AUTH UPDATE RESULT:', { authData, authUpdateError }); // ADD THIS
        if (authUpdateError) throw authUpdateError;

        const { data: dbData, error: dbError } = await supabase
            .from('users')
            .update({
                name: name ?? user.user_metadata?.name,
                email: email ?? user.email,
                role: role ?? user.user_metadata?.role
            })
            .eq('id', user.id)
            .select()
            .single();

        console.log('DB UPDATE RESULT:', { dbData, dbError }); // ADD THIS
        if (dbError) throw dbError;

        res.json({ message: 'Profile updated', user: dbData });
    } catch (err) {
        console.error('UPDATE PROFILE ERROR:', err);
        res.status(500).json({ msg: err.message });
    }
});

// Update another user's role (admin-only)
router.put('/update-role/:id', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ msg: 'No token' });

    const { role } = req.body;
    const targetId = req.params.id;

    if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ msg: 'Invalid role' });
    }

    try {
        // 1. Verify the requester is an admin
        const { data: { user: requester }, error: requesterError } = await supabase.auth.getUser(token);
        if (requesterError || !requester) return res.status(401).json({ msg: 'Invalid or expired token' });
        if (requester.user_metadata?.role !== 'admin') {
            return res.status(403).json({ msg: 'Admins only' });
        }

        // 2. Fetch the target user so we don't wipe their other metadata
        const { data: targetData, error: targetError } = await supabase.auth.admin.getUserById(targetId);
        if (targetError || !targetData?.user) return res.status(404).json({ msg: 'User not found' });

        // 3. Update auth metadata
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(targetId, {
            user_metadata: { ...targetData.user.user_metadata, role }
        });
        if (authUpdateError) throw authUpdateError;

        // 4. Update the users table row
        const { data: dbData, error: dbError } = await supabase
            .from('users')
            .update({ role })
            .eq('id', targetId)
            .select()
            .single();
        if (dbError) throw dbError;

        res.json({ message: 'Role updated', user: dbData });
    } catch (err) {
        console.error('UPDATE ROLE ERROR:', err);
        res.status(500).json({ msg: err.message });
    }
});

module.exports = router;