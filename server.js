
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let players = {};
let currentProblem = generateProblem();

function generateProblem() {
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return { text: `2 × ${number} = ?`, answer: number * 2 };
}

io.on("connection", (socket) => {
  socket.on("join", (username) => {
    players[socket.id] = { username, correct: 0, total: 0 };
    socket.emit("newProblem", currentProblem);
  });

  socket.on("answer", (value) => {
    const player = players[socket.id];
    if (!player) return;

    const correct = value === currentProblem.answer;
    if (correct) player.correct++;
    player.total++;

    socket.emit("feedback", { correct, correctAnswer: currentProblem.answer });

    currentProblem = generateProblem();
    io.emit("newProblem", currentProblem);
  });

  socket.on("updateStats", (data) => {
    if (!players[socket.id]) return;
    players[socket.id].correct = data.correct;
    players[socket.id].total = data.total;

    const others = Object.entries(players).filter(([id]) => id !== socket.id);
    if (others.length > 0) {
      const [, opp] = others[0];
      io.to(socket.id).emit("opponentStats", opp);
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log("Servidor activo");
});
