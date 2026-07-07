import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import config from "../../config";
import Loading from "../../components/Loading";

import { Toast } from "../../components/Notification"; // Import your Toast component
import CheckoutLoading from "./checkout-loading";
const COUNTRIES = ["Philippines"];

const PH_REGIONS = [
    "NCR", "Ilocos Region", "Cagayan Valley", "Central Luzon",
    "Calabarzon", "Mimaropa", "Bicol Region", "Western Visayas",
    "Central Visayas", "Eastern Visayas", "Zamboanga Peninsula",
    "Northern Mindanao", "Davao Region", "Soccsksargen", "Caraga",
    "Cordillera Administrative Region", "Bangsamoro",
];

const SIZE_LABEL_MAP = {
    xs: "XS", s: "S", m: "M", l: "L", xl: "XL", xxl: "XXL", xxxl: "XXXL", one_size: "One Size",
};
function getSizeLabel(sizeKey) {
    return SIZE_LABEL_MAP[sizeKey?.toLowerCase()] ?? sizeKey?.toUpperCase() ?? "—";
}
function formatPrice(p) {
    if (p === null || p === undefined || p === "") return "";
    return "₱" + Number(p).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

const emptyAddress = {
    country: "", firstName: "", lastName: "", email: "", barangay: "",
    street: "", postalCode: "", city: "", region: "", phone: "",
};

// ─── Validation ─────────────────────────────────────────────────────────────
// Regex refs:
//  - Email: standard "something@something.tld" shape (not fully RFC-compliant, but
//    good enough to catch typos without being overly strict).
//  - PH mobile phone: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX, spaces allowed.
//  - PH postal code: 4 digits.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_PHONE_RE = /^(?:\+63|0)9\d{9}$/;
const PH_POSTAL_RE = /^\d{4}$/;
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/; // letters, spaces, apostrophes, hyphens

function validateAddressFields(values) {
    const errors = {};

    if (!values.country?.trim()) {
        errors.country = "Please select a country.";
    } else if (!COUNTRIES.includes(values.country)) {
        errors.country = "Please select a valid country.";
    }

    if (!values.email?.trim()) {
        errors.email = "Email is required.";
    } else if (!EMAIL_RE.test(values.email.trim())) {
        errors.email = "Enter a valid email address.";
    }

    if (!values.firstName?.trim()) {
        errors.firstName = "First name is required.";
    } else if (!NAME_RE.test(values.firstName.trim())) {
        errors.firstName = "First name can only contain letters.";
    }

    if (!values.lastName?.trim()) {
        errors.lastName = "Last name is required.";
    } else if (!NAME_RE.test(values.lastName.trim())) {
        errors.lastName = "Last name can only contain letters.";
    }

    if (!values.barangay?.trim()) {
        errors.barangay = "Barangay is required.";
    }

    if (!values.street?.trim()) {
        errors.street = "Street address is required.";
    } else if (values.street.trim().length < 5) {
        errors.street = "Please enter a complete street address.";
    }

    if (!values.city?.trim()) {
        errors.city = "City / municipality is required.";
    }

    if (!values.postalCode?.trim()) {
        errors.postalCode = "Postal code is required.";
    } else if (!PH_POSTAL_RE.test(values.postalCode.trim())) {
        errors.postalCode = "Postal code must be exactly 4 digits.";
    }

    if (!values.region?.trim()) {
        errors.region = "Please select a region.";
    } else if (!PH_REGIONS.includes(values.region)) {
        errors.region = "Please select a valid region.";
    }

    if (!values.phone?.trim()) {
        errors.phone = "Phone number is required.";
    } else if (!PH_PHONE_RE.test(values.phone.replace(/[\s-]/g, ""))) {
        errors.phone = "Enter a valid PH mobile number (e.g. 09XX XXX XXXX).";
    }

    return errors;
}

// ─── Account menu (email + sign out) ───────────────────────────────────────
function AccountMenu({ email, onSignOut }) {
    const [open, setOpen] = useState(false);

    return (
        <div style={styles.accountWrap}>
            <span style={styles.accountEmail}>{email}</span>
            <div style={{ position: "relative" }}>
                <button
                    onClick={() => setOpen(p => !p)}
                    style={styles.dotsBtn}
                    aria-label="Account options"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="5" r="1.2" fill="#111" stroke="none" />
                        <circle cx="12" cy="12" r="1.2" fill="#111" stroke="none" />
                        <circle cx="12" cy="19" r="1.2" fill="#111" stroke="none" />
                    </svg>
                </button>
                {open && (
                    <>
                        <div style={styles.menuBackdrop} onClick={() => setOpen(false)} />
                        <div style={styles.dropdown}>
                            <button style={styles.dropdownItem} onClick={onSignOut}>
                                Sign out
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Address fields (shared by shipping + billing) ─────────────────────────
function AddressFields({ values, onChange, prefix, errors = {}, touched = {}, onBlur }) {
    const handle = (field) => (e) => onChange(prefix, field, e.target.value);
    const handleBlur = (field) => () => onBlur && onBlur(prefix, field);

    const showError = (field) => touched[field] && errors[field];
    const inputStyle = (field) => ({
        ...styles.input,
        ...(showError(field) ? styles.inputError : {}),
    });

    return (
        <div style={styles.formGrid}>
            <div style={styles.fieldFull}>
                <label style={styles.label}>Country</label>
                <select
                    className="checkout-input"
                    style={inputStyle("country")}
                    value={values.country}
                    onChange={handle("country")}
                    onBlur={handleBlur("country")}
                >
                    <option value="">Select country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {showError("country") && <span style={styles.errorText}>{errors.country}</span>}
            </div>

            <div style={styles.fieldFull}>
                <label style={styles.label}>Email</label>
                <input
                    className="checkout-input"
                    style={inputStyle("email")}
                    type="email"
                    value={values.email}
                    onChange={handle("email")}
                    onBlur={handleBlur("email")}
                    placeholder="you@example.com"
                    disabled={true}
                />
                {showError("email") && <span style={styles.errorText}>{errors.email}</span>}
            </div>

            <div style={styles.field}>
                <label style={styles.label}>First name</label>
                <input
                    className="checkout-input"
                    style={inputStyle("firstName")}
                    value={values.firstName}
                    onChange={handle("firstName")}
                    onBlur={handleBlur("firstName")}
                />
                {showError("firstName") && <span style={styles.errorText}>{errors.firstName}</span>}
            </div>
            <div style={styles.field}>
                <label style={styles.label}>Last name</label>
                <input
                    className="checkout-input"
                    style={inputStyle("lastName")}
                    value={values.lastName}
                    onChange={handle("lastName")}
                    onBlur={handleBlur("lastName")}
                />
                {showError("lastName") && <span style={styles.errorText}>{errors.lastName}</span>}
            </div>

            <div style={styles.fieldFull}>
                <label style={styles.label}>Barangay</label>
                <input
                    className="checkout-input"
                    style={inputStyle("barangay")}
                    value={values.barangay}
                    onChange={handle("barangay")}
                    onBlur={handleBlur("barangay")}
                />
                {showError("barangay") && <span style={styles.errorText}>{errors.barangay}</span>}
            </div>

            <div style={styles.fieldFull}>
                <label style={styles.label}>Street address</label>
                <input
                    className="checkout-input"
                    style={inputStyle("street")}
                    value={values.street}
                    onChange={handle("street")}
                    onBlur={handleBlur("street")}
                    placeholder="House no., building, street"
                />
                {showError("street") && <span style={styles.errorText}>{errors.street}</span>}
            </div>

            <div style={styles.field}>
                <label style={styles.label}>City</label>
                <input
                    className="checkout-input"
                    style={inputStyle("city")}
                    value={values.city}
                    onChange={handle("city")}
                    onBlur={handleBlur("city")}
                />
                {showError("city") && <span style={styles.errorText}>{errors.city}</span>}
            </div>
            <div style={styles.field}>
                <label style={styles.label}>Postal code</label>
                <input
                    className="checkout-input"
                    style={inputStyle("postalCode")}
                    value={values.postalCode}
                    onChange={handle("postalCode")}
                    onBlur={handleBlur("postalCode")}
                    inputMode="numeric"
                    maxLength={4}
                />
                {showError("postalCode") && <span style={styles.errorText}>{errors.postalCode}</span>}
            </div>

            <div style={styles.fieldFull}>
                <label style={styles.label}>Region</label>
                <select
                    className="checkout-input"
                    style={inputStyle("region")}
                    value={values.region}
                    onChange={handle("region")}
                    onBlur={handleBlur("region")}
                >
                    <option value="">Select region</option>
                    {PH_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {showError("region") && <span style={styles.errorText}>{errors.region}</span>}
            </div>

            <div style={styles.fieldFull}>
                <label style={styles.label}>Phone number</label>
                <input
                    className="checkout-input"
                    style={inputStyle("phone")}
                    type="tel"
                    value={values.phone}
                    onChange={handle("phone")}
                    onBlur={handleBlur("phone")}
                    placeholder="09XX XXX XXXX"
                />
                {showError("phone") && <span style={styles.errorText}>{errors.phone}</span>}
            </div>
        </div>
    );
}

// ─── Checkout form (shipping + payment + billing) ──────────────────────────
function CheckoutForm({ onSubmit, submitting, defaultEmail, onValidationError }) {
    const [shipping, setShipping] = useState({ ...emptyAddress, email: defaultEmail || "" });
    const [billing, setBilling] = useState(emptyAddress);
    const [sameAsShipping, setSameAsShipping] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState("cod");

    // per-section validation state
    const [shippingErrors, setShippingErrors] = useState({});
    const [billingErrors, setBillingErrors] = useState({});
    const [shippingTouched, setShippingTouched] = useState({});
    const [billingTouched, setBillingTouched] = useState({});
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);

    // fill in email once it loads from the account, if user hasn't typed one yet
    useEffect(() => {
        if (defaultEmail && !shipping.email) {
            setShipping(prev => ({ ...prev, email: defaultEmail }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultEmail]);

    // re-validate live once the user has tried to submit at least once,
    // so errors clear the moment a field becomes valid
    useEffect(() => {
        if (attemptedSubmit) setShippingErrors(validateAddressFields(shipping));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shipping, attemptedSubmit]);

    useEffect(() => {
        if (attemptedSubmit && !sameAsShipping) setBillingErrors(validateAddressFields(billing));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [billing, attemptedSubmit, sameAsShipping]);

    const handleChange = (which, field, value) => {
        const setter = which === "shipping" ? setShipping : setBilling;
        setter(prev => ({ ...prev, [field]: value }));
    };

    const handleBlur = (which, field) => {
        const setter = which === "shipping" ? setShippingTouched : setBillingTouched;
        setter(prev => ({ ...prev, [field]: true }));
    };

    const markAllTouched = (fields) =>
        Object.fromEntries(fields.map(f => [f, true]));

    const handleSubmit = (e) => {
        e.preventDefault();
        setAttemptedSubmit(true);

        const shipErrs = validateAddressFields(shipping);
        setShippingErrors(shipErrs);
        setShippingTouched(markAllTouched(Object.keys(emptyAddress)));

        let billErrs = {};
        if (!sameAsShipping) {
            billErrs = validateAddressFields(billing);
            setBillingErrors(billErrs);
            setBillingTouched(markAllTouched(Object.keys(emptyAddress)));
        }

        const hasErrors = Object.keys(shipErrs).length > 0 || Object.keys(billErrs).length > 0;
        if (hasErrors) {
            // scroll to the first invalid field's card
            const el = document.querySelector('[data-invalid="true"]');
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
            onValidationError?.("Please fix the highlighted fields before placing your order.");
            return;
        }

        onSubmit({ shipping, billing: sameAsShipping ? shipping : billing, paymentMethod });
    };

    // When COD is selected, force "Same as shipping address" and disable the radio buttons
    const isCod = paymentMethod === "cod";

    const handleBillingOptionChange = (value) => {
        // Only allow changing if NOT COD
        if (!isCod) {
            setSameAsShipping(value);
            if (value) setBillingErrors({}); // clear billing errors once it's no longer used
        }
    };

    const shippingHasError = attemptedSubmit && Object.keys(shippingErrors).length > 0;
    const billingHasError = attemptedSubmit && !sameAsShipping && Object.keys(billingErrors).length > 0;

    return (
        <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <div style={styles.card} data-invalid={shippingHasError ? "true" : "false"}>
                <div style={styles.cardHeader}>
                    <span style={styles.stepBadge}>1</span>
                    <h2 style={styles.sectionTitle}>Shipping address</h2>
                </div>
                <AddressFields
                    values={shipping}
                    onChange={handleChange}
                    prefix="shipping"
                    errors={shippingErrors}
                    touched={shippingTouched}
                    onBlur={handleBlur}
                />
            </div>

            <div style={styles.card}>
                <div style={styles.cardHeader}>
                    <span style={styles.stepBadge}>2</span>
                    <h2 style={styles.sectionTitle}>Payment</h2>
                </div>
                <label style={styles.paymentOption}>
                    <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "cod"}
                        onChange={() => {
                            setPaymentMethod("cod");
                            // Force "Same as shipping" when switching to COD
                            setSameAsShipping(true);
                            setBillingErrors({});
                        }}
                        style={styles.radioInput}
                    />
                    <div style={styles.paymentIconWrap}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5">
                            <rect x="2" y="6" width="20" height="13" rx="2" />
                            <circle cx="12" cy="12.5" r="3" />
                            <path d="M6 6V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
                        </svg>
                    </div>
                    <div>
                        <p style={styles.radioLabel}>Cash on Delivery (COD)</p>
                        <p style={styles.radioDesc}>
                            Pay in cash when your order arrives at your doorstep. No need to pay
                            anything online — just have the exact amount ready for the courier
                            upon delivery.
                        </p>
                    </div>
                </label>
            </div>

            <div style={styles.card} data-invalid={billingHasError ? "true" : "false"}>
                <div style={styles.cardHeader}>
                    <span style={styles.stepBadge}>3</span>
                    <h2 style={styles.sectionTitle}>Billing address</h2>
                    {isCod && (
                        <span style={{
                            fontSize: 12,
                            color: "#888",
                            marginLeft: "auto",
                            background: "#f5f5f5",
                            padding: "2px 10px",
                            borderRadius: 4,
                        }}>
                            Not needed for COD
                        </span>
                    )}
                </div>

                <label
                    style={{
                        ...styles.checkboxRow,
                        opacity: isCod ? 0.5 : 1,
                        cursor: isCod ? "not-allowed" : "pointer",
                    }}
                >
                    <input
                        type="radio"
                        name="billingOption"
                        checked={sameAsShipping}
                        onChange={() => handleBillingOptionChange(true)}
                        disabled={isCod}
                        style={styles.radioInput}
                    />
                    <span>Same as shipping address</span>
                    {isCod && <span style={{ fontSize: 12, color: "#999", marginLeft: 8 }}>(required for COD)</span>}
                </label>

                <label
                    style={{
                        ...styles.checkboxRow,
                        opacity: isCod ? 0.4 : 1,
                        cursor: isCod ? "not-allowed" : "pointer",
                    }}
                >
                    <input
                        type="radio"
                        name="billingOption"
                        checked={!sameAsShipping}
                        onChange={() => handleBillingOptionChange(false)}
                        disabled={isCod}
                        style={styles.radioInput}
                    />
                    <span>Use a different billing address</span>
                    {isCod && <span style={{ fontSize: 12, color: "#999", marginLeft: 8 }}>(unavailable for COD)</span>}
                </label>

                {!sameAsShipping && !isCod && (
                    <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px dashed #e2e2e2" }}>
                        <AddressFields
                            values={billing}
                            onChange={handleChange}
                            prefix="billing"
                            errors={billingErrors}
                            touched={billingTouched}
                            onBlur={handleBlur}
                        />
                    </div>
                )}

                {!sameAsShipping && isCod && (
                    <div style={{
                        marginTop: 18,
                        paddingTop: 18,
                        borderTop: "1px dashed #e2e2e2",
                        padding: "16px",
                        background: "#f9f9f9",
                        borderRadius: 8,
                        textAlign: "center",
                        color: "#999",
                        fontSize: 13,
                    }}>
                        <p style={{ margin: 0 }}>
                            ⚠️ Different billing address is not allowed for Cash on Delivery orders.
                        </p>
                    </div>
                )}
            </div>

            <button type="submit" className="place-order-btn" style={styles.submitBtn} disabled={submitting}>
                {submitting ? "Placing order…" : "Place order"}
            </button>
        </form>
    );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function CartCheckout() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Read as arrays so this page supports both:
    //  - single item: ?product_id=1&quantity=2&variant_id=9        (from "Buy it now")
    //  - multiple items: ?product_id=1&product_id=2&quantity=2&quantity=1&variant_id=&variant_id=9  (from Cart)
    // Positions line up: line[i] = { product_id: productIds[i], quantity: quantities[i], variant_id: variantIds[i] }
    const productIds = searchParams.getAll("product_id");
    const rawQuantities = searchParams.getAll("quantity");
    const rawVariantIds = searchParams.getAll("variant_id");

    const lineItems = productIds.map((id, i) => ({
        product_id: id,
        quantity: Number(rawQuantities[i]) || 1,
        // empty string means "no variant" for that line item, keep as null
        variant_id: rawVariantIds[i] ? rawVariantIds[i] : null,
    }));

    const [products, setProducts] = useState({}); // product_id -> product data
    const [variants, setVariants] = useState({}); // variant_id -> variant data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
    const [userEmail, setUserEmail] = useState("");

    // ── Toast notifications ──────────────────────────────────────────────────
    const [toasts, setToasts] = useState([]);

    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderNumber, setOrderNumber] = useState(null);

    const addToast = (title, message, type = "info") => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, title, message, type }]);
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            dismissToast(id);
        }, 5000);
    };

    const dismissToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // const userStr = localStorage.getItem("user");
    // console.log("User from localStorage:", userStr);

    // ── responsive check ──────────────────────────────────────────────────
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 900);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // ── auth check + fetch logged-in user's email ────────────────────────
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            navigate("/auth/login");
            return;
        }
        axios.get(`${config.baseApi}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => setUserEmail(res.data?.user?.email || ""))
            .catch(() => {
                localStorage.removeItem("access_token");
                navigate("/auth/login");
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── fetch every product + variant referenced in the params ───────────
    useEffect(() => {
        if (lineItems.length === 0) return;

        const fetchAll = async () => {
            try {
                setLoading(true);
                setError(null);

                const uniqueProductIds = [...new Set(lineItems.map(li => li.product_id))];
                const uniqueVariantIds = [...new Set(lineItems.map(li => li.variant_id).filter(Boolean))];

                const [productResults, variantResults] = await Promise.all([
                    Promise.all(
                        uniqueProductIds.map(id =>
                            axios.get(`${config.baseApi}/product/get-product-by-id`, { params: { id } })
                        )
                    ),
                    Promise.all(
                        uniqueVariantIds.map(id =>
                            axios.get(`${config.baseApi}/product/get-variant-by-id`, { params: { id } })
                        )
                    ),
                ]);

                const productMap = {};
                uniqueProductIds.forEach((id, i) => { productMap[id] = productResults[i].data; });

                const variantMap = {};
                uniqueVariantIds.forEach((id, i) => { variantMap[id] = variantResults[i].data; });

                setProducts(productMap);
                setVariants(variantMap);
            } catch (err) {
                console.error("Unable to fetch order details:", err);
                setError("Failed to load order details.");
                addToast("Error", "Failed to load order details.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.toString()]);

    const handleSignOut = () => {
        localStorage.removeItem("access_token");
        navigate("/auth/login");
    };

    if (loading) return <Loading />;

    if (lineItems.length === 0) {
        return (
            <div style={styles.centered}>
                <p style={{ color: "#c0392b", fontSize: 14 }}>No items to check out.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.centered}>
                <p style={{ color: "#c0392b", fontSize: 14 }}>{error}</p>
            </div>
        );
    }

    // ── build display rows + totals from every line item ─────────────────
    const rows = lineItems
        .map((li) => {
            const product = products[li.product_id];
            if (!product) return null;
            const variant = li.variant_id ? variants[li.variant_id] : null;

            let unitPrice = 0;
            if (variant) {
                const hasSale =
                    variant.product_variant_sale_price &&
                    Number(variant.product_variant_sale_price) > 0 &&
                    Number(variant.product_variant_sale_price) < Number(variant.product_variant_price);
                unitPrice = hasSale ? Number(variant.product_variant_sale_price) : Number(variant.product_variant_price);
            } else {
                const hasSale =
                    product.product_discount_price && Number(product.product_discount_price) < Number(product.product_price);
                unitPrice = hasSale ? Number(product.product_discount_price) : Number(product.product_price);
            }

            return {
                ...li,
                product,
                variant,
                unitPrice,
                lineTotal: unitPrice * li.quantity,
            };
        })
        .filter(Boolean);

    const subtotal = rows.reduce((sum, r) => sum + r.lineTotal, 0);
    const shippingFee = 0;
    const total = subtotal + shippingFee;

    const handlePlaceOrder = async (formData) => {
        setSubmitting(true);

        const empInfo = JSON.parse(localStorage.getItem('user')) || {};
        const userData = empInfo.user || {};

        const orderData = {
            items: rows.map(r => ({
                product_id: r.product_id,
                product_variant_id: r.variant_id,
                quantity: r.quantity,
                unit_price: r.unitPrice,
                line_total: r.lineTotal,
            })),
            user_id: userData.id || null,
            sub_total: subtotal,
            shipping_fee: shippingFee,
            total: total,
            country: formData.shipping.country,
            email: formData.shipping.email,
            first_name: formData.shipping.firstName,
            last_name: formData.shipping.lastName,
            barangay: formData.shipping.barangay,
            street_address: formData.shipping.street,
            city: formData.shipping.city,
            postal_code: formData.shipping.postalCode,
            region: formData.shipping.region,
            phone_number: formData.shipping.phone,
            billing: formData.shipping === formData.billing ? null : {
                country: formData.billing.country,
                email: formData.billing.email,
                first_name: formData.billing.firstName,
                last_name: formData.billing.lastName,
                barangay: formData.billing.barangay,
                street_address: formData.billing.street,
                city: formData.billing.city,
                postal_code: formData.billing.postalCode,
                region: formData.billing.region,
                phone_number: formData.billing.phone,
            },
            payment_method: formData.paymentMethod,
        };

        try {
            const response = await axios.post(
                `${config.baseApi}/product/create-order`,
                orderData,
                { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } }
            );

            // ── Only runs on success ──────────────────────────────
            localStorage.setItem("cart", JSON.stringify([]));
            setOrderNumber(response.data?.order_number || response.data?.id || null);
            addToast("Order Placed!", "Your order has been placed successfully.", "success");
            setOrderPlaced(true);

        } catch (err) {
            console.error("Order failed:", err);
            const errorMessage = err.response?.data?.message || "Failed to place order. Please try again.";
            addToast("Order Failed", errorMessage, "error");
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (orderPlaced) {
        return (
            <CheckoutLoading
                orderNumber={orderNumber || "WYF-004821"}
                onComplete={() => navigate('/')}
            />
        );
    }

    return (
        <div style={{ ...styles.page, padding: isMobile ? "20px 16px" : "60px" }}>
            <style>{`
                .checkout-input {
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }
                .checkout-input:focus {
                    outline: none;
                    border-color: #111 !important;
                    box-shadow: 0 0 0 3px rgba(17,17,17,0.08);
                }
                .place-order-btn {
                    transition: background 0.2s ease, transform 0.15s ease;
                }
                .place-order-btn:hover:not(:disabled) {
                    background: #2a2a2a;
                }
                .place-order-btn:active:not(:disabled) {
                    transform: scale(0.99);
                }
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
            `}</style>

            {/* Toast Container */}
            <div style={{ position: "fixed", bottom: 20, right: 24, zIndex: 9999, width: 340, pointerEvents: "none" }}>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        title={toast.title}
                        message={toast.message}
                        type={toast.type}
                        onDismiss={dismissToast}
                    />
                ))}
            </div>

            <div style={styles.topBar}>
                <AccountMenu email={userEmail} onSignOut={handleSignOut} />
            </div>

            <h1 style={styles.heading}>Checkout</h1>

            <div style={{
                ...styles.layout,
                ...(isMobile && { gridTemplateColumns: "1fr", display: "flex", flexDirection: "column-reverse" }),
            }}>
                <div style={styles.leftCol}>
                    <CheckoutForm
                        onSubmit={handlePlaceOrder}
                        submitting={submitting}
                        defaultEmail={userEmail}
                        onValidationError={(message) => addToast("Missing information", message, "error")}

                    />
                </div>

                <div style={styles.rightCol}>
                    <div style={{ ...styles.card, ...styles.summaryCard, position: isMobile ? "static" : "sticky" }}>
                        <h2 style={{ ...styles.sectionTitle, paddingBottom: 16 }}>Order summary</h2>

                        {rows.map((r, i) => (
                            <div key={i} style={styles.productRow}>
                                <img
                                    src={r.product.product_image_front}
                                    alt={r.product.product_name}
                                    style={styles.productImage}
                                />
                                <div style={styles.productInfo}>
                                    <p style={styles.productName}>{r.product.product_name}</p>
                                    {r.variant && (
                                        <p style={styles.productMeta}>Size: {getSizeLabel(r.variant.product_variant_size)}</p>
                                    )}
                                    <p style={styles.productMeta}>Qty: {r.quantity}</p>
                                </div>
                                <p style={styles.productPrice}>{formatPrice(r.lineTotal)}</p>
                            </div>
                        ))}

                        <div style={styles.summaryDivider} />

                        <div style={styles.summaryLine}>
                            <span>Subtotal</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div style={styles.summaryLine}>
                            <span>Shipping</span>
                            <span>{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</span>
                        </div>

                        <div style={styles.summaryDivider} />

                        <div style={styles.summaryTotal}>
                            <span>Total</span>
                            <span>{formatPrice(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── styles ─────────────────────────────────────────────────────────────────
const styles = {
    page: {
        background: "#fafafa",
        minHeight: "100vh",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        boxSizing: "border-box",
    },
    centered: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" },

    topBar: { maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "flex-end", paddingBottom: 12 },
    accountWrap: { display: "flex", alignItems: "center", gap: 10 },
    accountEmail: { fontSize: 13.5, color: "#444" },
    dotsBtn: {
        width: 32, height: 32, borderRadius: "50%", border: "1px solid #e2e2e2",
        background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    },
    menuBackdrop: { position: "fixed", inset: 0, zIndex: 10 },
    dropdown: {
        position: "absolute", top: 38, right: 0, background: "#fff",
        border: "1px solid #e5e5e5", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        zIndex: 20, minWidth: 130, overflow: "hidden",
    },
    dropdownItem: {
        width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13.5,
        background: "#fff", border: "none", cursor: "pointer", color: "#c0392b",
    },

    heading: { fontSize: 26, fontWeight: 700, margin: "0 0 28px", color: "#111", maxWidth: 1200, marginLeft: "auto", marginRight: "auto" },
    layout: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 380px",
        gap: 28,
        maxWidth: 1200,
        margin: "0 auto",
        alignItems: "start",
    },
    leftCol: { minWidth: 0 },
    rightCol: { minWidth: 0 },

    form: { display: "flex", flexDirection: "column", gap: 20 },
    card: {
        background: "#fff",
        border: "1px solid #ececec",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    },
    cardHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 18 },
    stepBadge: {
        width: 24, height: 24, borderRadius: "50%", background: "#111", color: "#fff",
        fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
    },
    sectionTitle: { fontSize: 16, fontWeight: 700, margin: 0, color: "#111" },

    formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
    field: { display: "flex", flexDirection: "column", gap: 6 },
    fieldFull: { display: "flex", flexDirection: "column", gap: 6, gridColumn: "1 / -1" },
    label: { fontSize: 12.5, color: "#555", fontWeight: 500 },
    input: {
        height: 44, border: "1px solid #ddd", borderRadius: 8, padding: "0 14px",
        fontSize: 14, background: "#fff", color: "#111", width: "100%", boxSizing: "border-box",
        fontFamily: "inherit",
    },
    inputError: {
        borderColor: "#c0392b",
        boxShadow: "0 0 0 3px rgba(192,57,43,0.08)",
    },
    errorText: {
        fontSize: 12,
        color: "#c0392b",
        marginTop: 2,
    },

    paymentOption: {
        display: "flex", gap: 14, alignItems: "flex-start", padding: "16px",
        borderRadius: 10, border: "1.5px solid #111", cursor: "pointer", background: "#fafafa",
    },
    paymentIconWrap: {
        width: 40, height: 40, borderRadius: 8, background: "#fff", border: "1px solid #e2e2e2",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    radioInput: { marginTop: 4, accentColor: "#111", flexShrink: 0 },
    radioLabel: { fontSize: 14, fontWeight: 700, margin: 0, color: "#111" },
    radioDesc: { fontSize: 12.5, color: "#666", margin: "4px 0 0", lineHeight: 1.6 },

    checkboxRow: { display: "flex", gap: 10, alignItems: "center", padding: "10px 0", fontSize: 14, cursor: "pointer", color: "#222" },

    submitBtn: {
        width: "100%", height: 52, background: "#111", color: "#fff",
        border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer",
        letterSpacing: "0.02em",
    },

    summaryCard: { top: 24 },
    productRow: { display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 },
    productImage: { width: 72, height: 72, objectFit: "cover", borderRadius: 8, background: "#f5f5f5", flexShrink: 0, border: "1px solid #eee" },
    productInfo: { flex: 1, minWidth: 0 },
    productName: { fontSize: 14, fontWeight: 600, margin: 0, color: "#111", lineHeight: 1.4 },
    productMeta: { fontSize: 12.5, color: "#777", margin: "4px 0 0" },
    productPrice: { fontSize: 13.5, fontWeight: 600, color: "#111", margin: 0, whiteSpace: "nowrap" },

    summaryDivider: { borderTop: "1px solid #eee", margin: "18px 0" },
    summaryLine: { display: "flex", justifyContent: "space-between", fontSize: 14, color: "#444", marginBottom: 10 },
    summaryTotal: { display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 700, color: "#111" },
};