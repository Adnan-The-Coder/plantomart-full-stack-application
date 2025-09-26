import { API_ENDPOINTS } from "@/config/api";
import { supabase } from "@/utils/supabase/client";
import { UserProfile } from "@/types/user";

const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const res = await fetch(API_ENDPOINTS.getProfileByUUID(userId), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const json:any = await res.json();

      if (json.success && json.data) {
        return {
          id: json.data.id || json.data.user_uuid || userId,
          email: json.data.email || '',
          full_name: json.data.full_name || json.data.name,
          avatar_url: json.data.avatar_url || json.data.profile_image,
          phone: json.data.phone,
          user_uuid: userId
        };
      }
    }

    // Fallback to Supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name,
        avatar_url:
          user.user_metadata?.avatar_url ||
          user.identities?.[0]?.identity_data?.avatar_url,
        phone: user.user_metadata.phone,
        user_uuid: userId
      };
    }

  } catch (err) {
    console.error("Error in fetchUserProfile:", err);
    // Fallback to Supabase auth again
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name,
        avatar_url:
          user.user_metadata?.avatar_url ||
          user.identities?.[0]?.identity_data?.avatar_url,
        phone: user.user_metadata.phone,
        user_uuid: userId
      };
    }
  }

  return null;
};

export default fetchUserProfile;
