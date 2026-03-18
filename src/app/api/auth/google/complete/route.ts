// =============================================================================
// GOOGLE OAUTH COMPLETE — Client-side page that reads cookie and sets localStorage
// =============================================================================

import { NextResponse } from "next/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get("redirect") || "/dashboard";

  // Return an HTML page that reads the cookie, sets localStorage, then redirects
  const html = `<!DOCTYPE html>
<html>
<head><title>Autenticando...</title></head>
<body>
<script>
  try {
    var cookie = document.cookie.split('; ').find(function(c) { return c.startsWith('detailhub_google_auth='); });
    if (cookie) {
      var data = JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('=')));
      if (data.accessToken) localStorage.setItem('detailhub_access_token', data.accessToken);
      if (data.role) localStorage.setItem('detailhub_user_role', data.role);
      if (data.firstName || data.lastName) localStorage.setItem('detailhub_user_name', ((data.firstName || '') + ' ' + (data.lastName || '')).trim());
      if (data.email) localStorage.setItem('detailhub_user_email', data.email);
      if (data.userId) localStorage.setItem('detailhub_user_id', data.userId);
      // Clear the temporary cookie
      document.cookie = 'detailhub_google_auth=; path=/; max-age=0';
    }
  } catch(e) {
    console.error('Google auth hydration error:', e);
  }
  window.location.href = ${JSON.stringify(redirect.startsWith("/") ? redirect : "/dashboard")};
</script>
<p>Autenticando...</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
