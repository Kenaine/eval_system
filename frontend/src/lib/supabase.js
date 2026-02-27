import { createClient } from '@supabase/supabase-js'

// Get Supabase credentials from environment variables
// Create a .env file in frontend/ with these values:
// REACT_APP_SUPABASE_URL=your-supabase-url
// REACT_APP_SUPABASE_ANON_KEY=your-publishable-key

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const authHelpers = {
    // Sign up with email and password
    async signUp(email, password, metadata = {}) {
        const {data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        })
        
        if (error) throw error
        return data
    },

    // Sign in with email and password
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        return { data, error }
    },

    // Sign out
    async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    // Get current session
    async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        return session
    },

    // Get current user
    async getUser() {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        return user
    },

    // Send password reset email
    async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) throw error
    },

    // Listen to auth state changes
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback)
    }
}
