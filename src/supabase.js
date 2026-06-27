import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rreottjphmxdwqjxyqtf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyZW90dGpwaG14ZHdxanh5cXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MjY5MzMsImV4cCI6MjA5ODAwMjkzM30.rv26RXQcRVLwyf2zbYS2qsvvAB-xoehiJ86JgdeE7iA'

export const supabase = createClient(supabaseUrl, supabaseKey)