let IS_PROD = true;
const server = IS_PROD
  ? "https://meetifybackend-avvc.onrender.com"
  : "http://localhost:3006";

export default server;
