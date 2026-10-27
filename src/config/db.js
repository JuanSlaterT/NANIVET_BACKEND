{
  "DB_HOST": process.env.DB_HOST || "localhost",
  "DB_PORT": parseInt(process.env.DB_PORT || "5432", 10),
  "DB_NAME": process.env.DB_NAME || "nanivet",
  "DB_USER": process.env.DB_USER || "postgres",
  "DB_PASSWORD": process.env.DB_PASSWORD || "",
  "DB_POOL_MIN": parseInt(process.env.DB_POOL_MIN || "2", 10),
  "DB_POOL_MAX": parseInt(process.env.DB_POOL_MAX || "10", 10)
}
