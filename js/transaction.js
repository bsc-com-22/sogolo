
import { supabase } from './supabaseClient.js'

// --- Transaction CRUD ---

export async function createTransaction(title, description, buyerId) {
    const { data, error } = await supabase
        .from('transactions')
        .insert([{ title, description, buyer_id: buyerId, status: 'created' }])
        .select()
        .single()
    return { data, error }
}

export async function joinTransaction(transactionId, sellerId) {
    // Check if transaction exists and has no seller
    const { data: existing, error: fetchError } = await supabase
        .from('transactions')
        .select('seller_id')
        .eq('id', transactionId)
        .single()

    if (fetchError) return { error: fetchError }
    if (existing.seller_id) return { error: { message: 'Transaction already has a seller.' } }

    const { data, error } = await supabase
        .from('transactions')
        .update({ seller_id: sellerId })
        .eq('id', transactionId)
        .select()
        .single()
    return { data, error }
}

export async function getTransaction(transactionId) {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .maybeSingle()
    return { data, error }
}

// --- Product Submission ---

export async function uploadProductImages(transactionId, files) {
    const uploadPromises = Array.from(files).map(async (file) => {
        const fileName = `${transactionId}/${Date.now()}-${file.name}`
        const { error } = await supabase.storage
            .from('transaction-images')
            .upload(fileName, file)

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
            .from('transaction-images')
            .getPublicUrl(fileName)

        return publicUrl
    })

    try {
        const urls = await Promise.all(uploadPromises)

        // Batch insert into DB
        const imageRecords = urls.map(url => ({
            transaction_id: transactionId,
            image_url: url
        }))

        const { error } = await supabase.from('product_images').insert(imageRecords)
        if (error) throw error

        return { urls }
    } catch (error) {
        return { error }
    }
}

export async function submitProduct(transactionId, productName, productDescription, price) {
    // 1. Create product submission
    const { data: submission, error: subError } = await supabase
        .from('product_submissions')
        .insert([{
            transaction_id: transactionId,
            product_name: productName,
            product_description: productDescription,
            price
        }])
        .select()
        .single()

    if (subError) return { error: subError }

    // 2. Update transaction status
    const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'product_submitted', price: price })
        .eq('id', transactionId)

    return { data: submission, error: updateError }
}

export async function getProductDetails(transactionId) {
    const { data: submission, error: subError } = await supabase
        .from('product_submissions')
        .select('*')
        .eq('transaction_id', transactionId)
        .maybeSingle()

    const { data: images, error: imgError } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('transaction_id', transactionId)

    return { submission, images, error: subError || imgError }
}

// --- Buyer Actions ---

export async function approveProduct(transactionId) {
    const { data, error } = await supabase
        .from('transactions')
        .update({ status: 'product_approved' })
        .eq('id', transactionId)
        .select()
        .single()
    return { data, error }
}

export async function rejectProduct(transactionId, reason) {
    // Ideally store reason, for now just update status
    const { data, error } = await supabase
        .from('transactions')
        .update({ status: 'rejected' }) // Or 'created' to reset?
        .eq('id', transactionId)
        .select()
        .single()
    return { data, error }
}

export async function uploadPaymentProof(transactionId, file, amount) {
    const fileName = `payments/${transactionId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
        .from('transaction-images')
        .upload(fileName, file)

    if (uploadError) return { error: uploadError }

    const { data: { publicUrl } } = supabase.storage
        .from('transaction-images')
        .getPublicUrl(fileName)

    // Save proof and update status atomically if possible, but sequential is fine here
    const { error: dbError } = await supabase
        .from('payment_proofs')
        .insert([{ transaction_id: transactionId, proof_url: publicUrl, amount }])

    if (dbError) return { error: dbError }

    const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'payment_uploaded' })
        .eq('id', transactionId)

    return { error: updateError }
}

// --- Admin Actions ---

export async function verifyPayment(transactionId) {
    const { data, error } = await supabase
        .from('transactions')
        .update({ status: 'payment_verified' })
        .eq('id', transactionId)
        .select()
        .single()
    return { data, error }
}

export async function rejectPayment(transactionId) {
    const { data, error } = await supabase
        .from('transactions')
        .update({ status: 'payment_rejected' })
        .eq('id', transactionId)
        .select()
        .single()
    return { data, error }
}

export async function releaseFunds(transactionId) {
    const { data, error } = await supabase
        .from('transactions')
        .update({ status: 'funds_released' })
        .eq('id', transactionId)
        .select()
        .single()
    return { data, error }
}

export async function getAllTransactions() {
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
    return { data, error }
}

export async function getPaymentProof(transactionId) {
    const { data, error } = await supabase
        .from('payment_proofs')
        .select('*')
        .eq('transaction_id', transactionId)
        .maybeSingle()
    return { data, error }
}

export async function markProductDelivered(transactionId) {
    const { data, error } = await supabase
        .from('transactions')
        .update({ status: 'product_delivered' })
        .eq('id', transactionId)
        .select()
        .single()
    return { data, error }
}

export async function passInspection(transactionId) {
    const { data, error } = await supabase
        .from('transactions')
        .update({ status: 'inspection_passed' })
        .eq('id', transactionId)
        .select()
        .single()
    return { data, error }
}

export async function failInspection(transactionId) {
    const { data, error } = await supabase
        .from('transactions')
        .update({ status: 'inspection_failed' })
        .eq('id', transactionId)
        .select()
        .single()
    return { data, error }
}

export async function setDeliveryDetails(transactionId, method, branch) {
    const { data, error } = await supabase
        .from('transactions')
        .update({
            delivery_method: method,
            delivery_branch: branch
        })
        .eq('id', transactionId)
        .select()
        .single()
    return { data, error }
}

export async function uploadDispatchReceipt(transactionId, file) {
    const fileName = `${transactionId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
        .from('transaction-receipts')
        .upload(fileName, file)

    if (uploadError) return { error: uploadError }

    const { data: { publicUrl } } = supabase.storage
        .from('transaction-receipts')
        .getPublicUrl(fileName)

    const { error: updateError } = await supabase
        .from('transactions')
        .update({
            status: 'dispatched',
            dispatch_receipt_url: publicUrl
        })
        .eq('id', transactionId)

    return { error: updateError }
}

// --- Real-time ---

export function subscribeToTransaction(transactionId, callback) {
    return supabase
        .channel(`transaction-${transactionId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'transactions',
                filter: `id=eq.${transactionId}`
            },
            (payload) => {
                callback(payload.new)
            }
        )
        .subscribe()
}
