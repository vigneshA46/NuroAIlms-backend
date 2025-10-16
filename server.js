const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use(cors({
  origin: "*", // frontend origin (React dev server)
  methods: ["GET", "POST", "PUT", "DELETE","PATCH"], // allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // allowed headers
  credentials: true
}));


// API routes
app.use("/colleges", require("./routes/colleges"));
app.use("/departments", require("./routes/departments"));
app.use("/students", require("./routes/students"));
app.use("/auth",require("./routes/auth"));
app.use("/coding",require("./routes/codingChallenges"))
app.use("/test",require("./routes/tests"))
app.use("/question",require("./routes/question"))
app.use("/submission",require("./routes/submissions"))
app.use("/studentdata",require("./routes/studentData"))
app.use("/admin",require("./routes/admin"))


const PORT = 3000;
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
