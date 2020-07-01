import axios from 'axios'
import express from 'express'
import { Server } from 'http'
import logger from 'morgan'
import htmlparser2 from 'htmlparser2'
import cheerio from 'cheerio'
import mongoose from 'mongoose'
import moment from 'moment'
import scraperapi from 'scraperapi-sdk'
import httpsProxyAgent from 'https-proxy-agent'
import request from 'request'
import http from 'http'

const app = express();
const port = process.env.PORT || 5000;
const server = Server(app);
const connection = mongoose.connection;
const scraperapiClient = scraperapi('2abb6d64c5dfec7b4742667161891d9c') //proxy

connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
  console.log("The database is " + connection.name)
})
mongoose.connect("mongodb://localhost:27017/stock_trading_platform", { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });


app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'))

server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

const get_all_stocks = async() => {
  const instance = mongoose.model("Stock", new mongoose.Schema(), 'stock')
  const date = new Date('2020-04-16')
  const result = await instance.find({data_time: date}).limit(200).lean().exec()
  return result
}

const request_with_proxy = async(host, url) => {
  const agent = new httpsProxyAgent(host); //proxy agent
  const options = {
    method: "GET",
    url: url,
    httpsAgent: agent
  }
  let response = await axios(options)
  return response
}

const crawl_stock = async(stock_id) => {
  const url = 'https://goodinfo.tw/StockInfo/StockDetail.asp?STOCK_ID=' + stock_id
  // const response = await axios.get(url)
  const response = await request_with_proxy('http://103.224.195.41:3128', url)
  const $ = cheerio.load(response.data)
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

  return {fields, values}
}

app.get("/main", async(req, res) => {
  const all_stocks = await get_all_stocks()
  const result = []
  const loop = async(stock_id) => {
    let stock_data = await crawl_stock(stock_id)
    console.log(stock_data)
    result.push(stock_data)
    return stock_data
  }
  let start_time = moment()
  console.log(start_time.toDate())
  const promises = all_stocks.map((item, i) => {
    return loop(item.stock_id)
  })
  const p = await Promise.all(promises)
  console.log(p)
  console.log(moment().diff(start_time, 'seconds'))
  res.send(result)
})

app.get("/test1", async(req, res) => {
  var response = await scraperapiClient.get('https://goodinfo.tw/StockInfo/index.asp')
  res.send(response)
})

app.get("/test2", async(req, res) => {
  const agent = new httpsProxyAgent('http://103.224.195.41:3128'); //proxy agent
  const options = {
    method: "GET",
    url: "https://goodinfo.tw/StockInfo/index.asp",
    httpsAgent: agent
  }
  let response = await axios(options)
  res.send(response.data)
})

app.get("/test3", async(req, res) => {
  let proxyUrl = 'http://113.195.23.125:9999'
  let proxiedRequest = request.defaults({'proxy': proxyUrl});
  let response = await proxiedRequest.get("https://goodinfo.tw/StockInfo/index.asp")
  console.log(response)
  res.send(response.data)
})

app.get("/test4", async(req, res) => {
  var req = http.request({
    host: 'http://144.76.174.21',
    // proxy IP
    port: 9999,
    // proxy port
    method: 'GET',
    path: 'https://www.pchome.com.tw/' // full URL as path
    }, function (res) {
        res.on('data', function (data) {
        console.log(data.toString());
    });
  });
  req.end();
})

//http://3.14.120.193:3838
//http://211.21.92.211:4151