import { createClient } from "@supabase/supabase-js";

const supabaseUrl="https://bccasaeaogizycotdqxc.supabase.co";
const supabasePublishableKey="sb_publishable_mo2D8jsgq0IKDcSltUT2nw_VQt-KKzx";

export const supabase=createClient(supabaseUrl,supabasePublishableKey,{
 auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});
