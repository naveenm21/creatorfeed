import { supabaseAdmin } from './supabase-admin'

export async function awardKarma(userId: string, amount: number, reason: string) {
  if (!userId) return null

  console.log(`Awarding ${amount} karma to ${userId} for: ${reason}`)

  // Fetch current karma
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('karma')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching user karma:', error)
    return null
  }

  // Calculate new karma
  const currentKarma = data?.karma || 0
  const newKarma = currentKarma + amount

  // Update with new karma
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('users')
    .update({ 
      karma: newKarma,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating karma:', updateError)
    return null
  }

  return updated
}
