const express = require('express');
const multer = require("multer");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
//const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({extended: true}));

app.use("/static", express.static(path.join(__dirname, "static")));
app.use("/uploads", express.static('uploads'))
app.use(cors());


//const varUrlEncodedParser = bodyParser.urlencoded({ extended: false });


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname)
  }
})

const fileFilter = function(req, file, cb) {
    const allowedTypes = ["application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

    if (!allowedTypes.includes(file.mimetype)) {
        const error = new Error("Wrong file type");
        error.code = "LIMIT_FILE_TYPES";
        error.detail = file.mimetype; 
        return cb(error, false);
    }

    cb(null, true);
}

const MAX_SIZE = 10000 * 1000;

const upload = multer({
    storage: storage, 
    fileFilter,
    limits: {
        fileSize: MAX_SIZE
    }
})


//const upload = multer({ 
//    dest: './uploads/'
//})

function formatDate(dateString) {
  console.log(dateString);
  var date = new Date(dateString);
  var year = date.getFullYear();
  var month = date.getMonth()+1;
  var day = date.getDate();

  if (day < 10) {
    day = '0' + day;
  }
  if (month < 10) {
    month = '0' + month;
  }

  var formattedDate = day + '-' + month + '-' + year
  return formatDate;
}


//function processExcel(file) {
function processExcel(req) {
    console.log(`start processing ${req.file.path}`);
    var workbook = XLSX.readFile(req.file.path);

    var gmssWB = XLSX.utils.book_new();

    var first_sheet_name = workbook.SheetNames[0];
    console.log(`start processing ${first_sheet_name}`);
    var worksheet = workbook.Sheets[first_sheet_name];
    var range = XLSX.utils.decode_range(worksheet["!ref"]);
    console.log(`start processing ${range}`);

    var input_rows = XLSX.utils.sheet_to_json(worksheet, {range: range, header: 1})
    //console.log(input_rows[4]);
    //console.log(input_rows[4].length);
    //console.log(input_rows.length);

    var new_ws_name = "GMSS_CXD_Template";

    /* make worksheet */
    var ws_data = [
    ["CAMPAIGN_CODE","RESPONSE_TYPE","RESPONSE_DATE","FIRST_NAME","LAST_NAME","COUNTRY","EMAIL_ADDRESS","COMPANY_NAME","WORK_PHONE_NO","JOB_TITLE","CITY","STATE_OR_PROVINCE","POSTAL_CODE","STREET_ADDRESS_1","STREET_ADDRESS_2","LEAD_OR_ADDITIONAL_NOTES"," NO_LEAD_FLOW","TRANSLATED_FIRST_NAME","TRANSLATED_LAST_NAME","TRANSLATED_COMPANY_NAME","CXD_CONTACT_ID","MARKETING_STATUS","SALES_REP_ID","PHONE_PREFERENCE","DIRECT_MAIL_PREFERENCE","EMAIL_PREFERENCE","TELEMARKETING_CALL_AGENT_NAME","TELEMARKETING_COMPANY_NAME"]
    ];

    console.log(`input_rows[0][0] ${input_rows[0][0]}`)

    var campaign_row = input_rows[1][0];
    var date_row = input_rows[2][0];

    console.log(campaign_row);
    //myString.substring( myString.indexOf( '(' ) + 1, myString.indexOf( ')' ) );
    var campaign_code = campaign_row.substring(campaign_row.indexOf('[')+1, campaign_row.indexOf(']'));
    console.log(campaign_code);
    console.log(date_row);
    var response_date = new Date(date_row.substring(0,date_row.lastIndexOf("-")));
    console.log(response_date);
    response_date = `${("0" + response_date.getDate()).slice(-2)}-${("0" + (response_date.getMonth() + 1)).slice(-2)}-${response_date.getFullYear()}`
    console.log(response_date);

    campaign_code = req.body.campaign_code || campaign_code;
    console.log(campaign_code);
    var RESPONSE_TYPE = req.body.response_type;
    //var RESPONSE_DATE = formatDate(workbook.Props.CreatedDate);
    RESPONSE_DATE = req.body.response_date || response_date;
    console.log(response_date);
    
    console.log(`Response_Date: ${RESPONSE_DATE}`);
   //console.log(`Response_Date: ${req.body}`);
    console.log('start preparing');

    for (let i = 5; i < input_rows.length; i++) { 
    //console.log(input_rows[i]);
    let tmp_row = [];
    tmp_row[0] = campaign_code;
    tmp_row[1] = RESPONSE_TYPE;
    tmp_row[2] = RESPONSE_DATE;
    tmp_row[3] = input_rows[i][3];
    tmp_row[4] = input_rows[i][4];
    tmp_row[5] = input_rows[i][8];
    tmp_row[6] = input_rows[i][5]; // email
    tmp_row[7] = input_rows[i][7]; // company
    tmp_row[8] = input_rows[i][14]; // work_phone
    tmp_row[9] = input_rows[i][6]; // job_title
    tmp_row[10] = input_rows[i][11]; // city
    tmp_row[11] = input_rows[i][12]; // state
    tmp_row[12] = input_rows[i][13]; // plz
    tmp_row[13] = input_rows[i][9]; // addr1
    tmp_row[14] = input_rows[i][10]; // addr2
    for (let x = 15; x< input_rows[i].length; x++) {
        tmp_row[x] = input_rows[i][x];
    }

    ws_data.push(tmp_row);
    //console.log(tmp_row);
    
    //if (i > 10) break; // remove that
    };

    var ws = XLSX.utils.aoa_to_sheet(ws_data);

    /* Add the worksheet to the workbook */
   //XLSX.utils.book_append_sheet(workbook, ws, new_ws_name);
    XLSX.utils.book_append_sheet(gmssWB, ws, new_ws_name);

    //const out_file = `${file}_out.xls`;
    const out_file = `${req.file.path}_out.xls`;
    //XLSX.writeFile(workbook, out_file);
    XLSX.writeFile(gmssWB, out_file);

    console.log('finishing the xls processing');
    return out_file;
    
}

// file is from formData from SimpleUpload.vue
app.post('/upload', upload.single('file'), (req, res) => {
    console.log('req.body.campaign_code');
    console.log(req.body);
    var processed_file;
    try {
        //processed_file = processExcel(req.file.path);
        processed_file = processExcel(req);
        console.log('out from processing');
        // above function should process and save to ./static/${req.file.originalname}
        //fs.readFile
        //console.log(`req.body: ${req.body}`);
        
        //console.log(`writing to: ${JSON.stringify(req)}`);
        //console.log(`writing to: ${req.file.path}`);
        //console.log(`writing to: ${processed_file}`);

        const host = req.hostname;
        const filePath = req.protocol + "://" + host + '/' + req.file.path;

        console.log(host);
        console.log(filePath);


        //res.redirect(`/download/${processed_file}`);

        //res.render('/')
        //fs.unlink(req.file.path, () => {
        //    res.json({ file: `./static/${req.file.originalname}`});
        //})
    } catch(err) {
        res.status(422).json({ err })
    }
    //res.json({ file: req.file });
    res.json({ file: processed_file });
});

app.get('/uploads/:file', (req, res) => {
    console.log(`in get ${req.params.file}`);
    res.download(`${req.params.file}`);
});

app.get('/download/:file(*)', (req, res) => {
    console.log('here');
    //console.log(req);
    console.log(req.params.file);
    var file = req.params.file;
    var fileLocation = path.join('/',file);
    console.log(fileLocation);
    res.download(fileLocation, file); 
});

app.use(function(err, req, res, next) {
    if (err.code === "LIMIT_FILE_TYPES") {
        res.status(422).json({ error: `${err.detail} - But only excel files are allowed`});
        return ;
    }

    if (err.code === "LIMIT_FILE_SIZE") {
        res.status(422).json({ error: `Too big file size - limit ${MAX_SIZE/1000}kB`});
        return ;
    }
})

app.listen(3344, () => console.log("Running on localhost:3344"));

