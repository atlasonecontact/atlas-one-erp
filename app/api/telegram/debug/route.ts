import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Debug endpoint to check Telegram configuration
// GET /api/telegram/debug?chatId=YOUR_CHAT_ID

export async function GET(request: NextRequest) {
  try {
    const chatId = request.nextUrl.searchParams.get("chatId")
    
    // Debug: Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    const envStatus = {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      serviceRoleKeyLength: serviceRoleKey?.length || 0,
      serviceRoleKeyPrefix: serviceRoleKey?.substring(0, 10) || "NOT_SET",
    }
    
    if (!chatId) {
      return NextResponse.json({ 
        error: "Falta el parámetro chatId",
        usage: "/api/telegram/debug?chatId=TU_CHAT_ID",
        envStatus
      }, { status: 400 })
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        error: "Variables de entorno no configuradas",
        envStatus,
        searchedChatId: chatId
      }, { status: 500 })
    }

    // Create admin client directly here for debugging
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 1. Check profiles table
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, full_name, telegram_chat_id")
      .eq("telegram_chat_id", chatId)

    // 2. Check notification_configs table
    const { data: configs, error: configError } = await supabase
      .from("notification_configs")
      .select(`
        id,
        kiosko_id,
        telegram_chat_id,
        telegram_enabled,
        telegram_verified,
        kioscos (id, name, owner_id)
      `)
      .eq("telegram_chat_id", chatId)

    // 3. Get all notification_configs to see what chat IDs are saved
    const { data: allConfigs } = await supabase
      .from("notification_configs")
      .select("kiosko_id, telegram_chat_id, telegram_enabled")
      .not("telegram_chat_id", "is", null)
      .limit(10)

    // 4. Get all profiles with telegram_chat_id
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, username, telegram_chat_id")
      .not("telegram_chat_id", "is", null)
      .limit(10)

    return NextResponse.json({
      envStatus,
      searchedChatId: chatId,
      foundInProfiles: profiles?.length || 0,
      foundInNotificationConfigs: configs?.length || 0,
      profiles: profiles || [],
      notificationConfigs: configs || [],
      profilesError: profileError?.message || null,
      configsError: configError?.message || null,
      allSavedChatIds: {
        inProfiles: allProfiles?.map(p => ({ 
          username: p.username, 
          chatId: p.telegram_chat_id 
        })) || [],
        inConfigs: allConfigs?.map(c => ({ 
          kioskoId: c.kiosko_id, 
          chatId: c.telegram_chat_id,
          enabled: c.telegram_enabled
        })) || [],
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || "Error interno",
      stack: error.stack
    }, { status: 500 })
  }
}
