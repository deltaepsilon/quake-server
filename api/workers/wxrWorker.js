process.on('message', function (message) {
  console.log('worker received message', message);

  process.send('message back to parent');
});
