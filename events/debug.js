// debug.js
module.exports = (client) => {
  // Aynı hata nesnesini birden fazla kez loglamamak için WeakSet
  const seenErrors = new WeakSet();
  // Aynı reddedilen promise'i birden fazla kez loglamamak için WeakSet
  const seenPromises = new WeakSet();
  // Aynı warn mesajını birden fazla kez loglamamak için Set
  const seenWarnings = new Set();

  // Unhandled promise rejections'i yakala
  process.on("unhandledRejection", (reason, promise) => {
    // Eğer bu promise'i daha önce görmediysek logla
    if (!seenPromises.has(promise)) {
      seenPromises.add(promise);

      console.error(
        "⚠️ Unhandled Rejection (örn. bir promise reddedildi):",
        reason
      );
    }
    // Aksi halde sessizce geç
  });

  // Uncaught exceptions'ı yakala
  process.on("uncaughtException", (error) => {
    // Eğer bu error nesnesini daha önce görmediysek logla
    if (!seenErrors.has(error)) {
      seenErrors.add(error);

      console.error(
        "⚠️ Uncaught Exception (bir yerde yakalanmamış hata):",
        error
      );
    }
  });

  // Discord.js client-level hata ve uyarılarını swallow et
  client.on("error", (error) => {
    if (!seenErrors.has(error)) {
      seenErrors.add(error);

      console.error("⚠️ Discord.js Client Error:", error);
    }
  });

  client.on("warn", (info) => {
    // Uyarıyı string hâline getirip Set içinde kontrol et
    const key = typeof info === "string" ? info : JSON.stringify(info);
    if (!seenWarnings.has(key)) {
      seenWarnings.add(key);

      console.warn("⚠️ Discord.js Warning:", info);
    }
  });
};
