require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

const paymentsRouter = require('./routes/payments');

app.use('/api/payments', paymentsRouter);


app.get('/health',(req,res)=>{
    res.json({status: 'ok',timestamp: new Date().toISOString()});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
});