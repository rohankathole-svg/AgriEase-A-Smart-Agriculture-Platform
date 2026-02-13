// Quick localStorage check utility
// Run this in browser console to debug token issues

console.log("=== AgriEase Token Debug ===");

const userData = localStorage.getItem("user");

if (!userData) {
  console.error("❌ No user data in localStorage");
  console.log("Solution: Login again");
} else {
  console.log("✓ User data exists in localStorage");
  
  try {
    const parsed = JSON.parse(userData);
    console.log("User Data:", parsed);
    
    if (parsed.token) {
      console.log("✓ Token exists");
      console.log("Token preview:", parsed.token.substring(0, 30) + "...");
      console.log("Token length:", parsed.token.length);
      
      // Check token structure
      const parts = parsed.token.split('.');
      if (parts.length === 3) {
        console.log("✓ Token has valid JWT structure (3 parts)");
      } else {
        console.error("❌ Invalid JWT structure, has", parts.length, "parts");
      }
    } else {
      console.error("❌ No token in user data");
    }
    
    if (parsed.role) {
      console.log("✓ Role:", parsed.role);
    } else {
      console.error("❌ No role in user data");
    }
    
    if (parsed.name) {
      console.log("✓ Name:", parsed.name);
    }
    
    if (parsed.userId) {
      console.log("✓ User ID:", parsed.userId);
    }
    
  } catch (e) {
    console.error("❌ Error parsing user data:", e);
    console.log("Raw data:", userData);
  }
}

console.log("=========================");
