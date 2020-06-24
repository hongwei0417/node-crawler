import axios from 'axios'
import express from 'express'
import { Server } from 'http'
import logger from 'morgan'
import htmlparser2 from 'htmlparser2'
import cheerio from 'cheerio'


const app = express();
const port = process.env.PORT || 5000;
const server = Server(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'))

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

app.get("/main", async(req, res) => {
  const result = await axios.get('https://goodinfo.tw/StockInfo/StockDetail.asp?STOCK_ID=0050')
  const $ = cheerio.load(result.data);
  const table = $('table.solid_1_padding_3_1_tbl > tbody')
  var fields = []
  var values = []
  table.children('tr').each((i, tr) => {
    if(i === 1 || i === 3 || i === 5) {
      $(tr).children('td').each((j, td) => {
        fields.push($(td).text())
      })
    } else if(i === 2 || i === 4 || i === 6) {
      $(tr).children('td').each((j, td) => {
        values.push($(td).text())
      })
    }
  })
  // const tr1 = table.find('tr:nth-child(3)')
  console.log(fields, values)
  res.send(200)
})