module.exports = (client, debug) => {
  if (!client.config.debug) return;
  else console.log(debug);
};

// Hata yakalama ve loglama işlemleri
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Burada, hatayı bir dosyaya da kaydedebilirsiniz
  // fs.appendFileSync('error.log', `${new Date().toISOString()} - Uncaught Exception: ${err.stack}\n`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Burada da unhandled rejection hatalarını kaydedebilirsiniz
  // fs.appendFileSync('error.log', `${new Date().toISOString()} - Unhandled Rejection: ${reason}\n`);
});
