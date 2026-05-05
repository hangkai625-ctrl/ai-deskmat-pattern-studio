module.exports = {
  apps: [
    {
      name: "ai-deskmat-pattern-studio",
      script: "server.mjs",
      env: {
        NODE_ENV: "production",
        PORT: "5173",
        IMAGE_API_URL: "https://api.mooko.ai/v1/images/generations",
        IMAGE_EDIT_API_URL: "https://api.mooko.ai/v1/images/edits",
        IMAGE_MODEL: "gpt-image-2-pro",
        IMAGE_SIZE: "2048x1152",
        IMAGE_QUALITY: "high",
        IMAGE_MODERATION: "auto",
        IMAGE_RESPONSE_FORMAT: "b64_json"
      }
    }
  ]
};
