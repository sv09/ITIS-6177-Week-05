const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = 3000;

const mariadb = require('mariadb');
const pool = mariadb.createPool({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'sample',
	port: 3306,
	connectionLimit: 5
});

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const jsonpatch = require('json-patch');

const options = {
    swaggerDefinition:{
        info:{
            title: 'ITIS 6177 REST API and Swagger',
            version: '1.0.0',
            description: 'ITIS-6177-Week-05 API autogenerated by Swagger'
        },
        host: '206.189.204.93:3000',
        basePath: '/',
    },
    apis: ['./server.js'],
};

const specs = swaggerJsdoc(options);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use(cors());

app.use(bodyParser.json());
//var jsonParser = bodyParser.json();

app.get('/', (req, res) => {
	res.send('Home Page');
});

/**
 * @swagger
 * /api/agents:
 *    get:
 *      description: Return all the agents details
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Array of all the agent objects
 */
app.get('/api/agents', async function (req, res){
	let conn;
	try{
		conn = await pool.getConnection();
		//console.log('connection established');
		rows = await conn.query("SELECT * FROM agents;");
		//console.log('got all the rows');
		//console.log(rows);
		res.setHeader('cache-control', ['max-age=4','public'])
		res.json(rows);
	}catch(err){
		throw err;
	}finally{
		if(conn) return conn.release();
	}
});

/**
 * @swagger
 * /api/customers:
 *    get:
 *      description: Return all the customer details
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Array of all the customer objects 
 */
app.get('/api/customers', async function(req, res){
	let conn;
	try{
		conn = await pool.getConnection();
		rows = await conn.query("SELECT * FROM customer;");
		res.setHeader('cache-control', ['max-age=4','public'])
		res.json(rows);
	}catch(err){
		throw err;
	}finally{
		if(conn) return conn.release();
	}
});


/**
 * @swagger
 * /api/company:
 *    get:
 *      description: Return all company details
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Array of all the company objects
 */
app.get('/api/company', async function(req, res){
        let conn;
        try{
                conn = await pool.getConnection();
                rows = await conn.query("SELECT * FROM company;");
		res.setHeader('cache-control', ['max-age=4','public'])
                res.json(rows);
        }catch(err){
                throw err;
        }finally{
                if(conn) return conn.release();
        }
});

/**
 * @swagger
 * /api/company/{COMPANY_ID}:
 *    get:
 *      description: Returns the company record for the COMPANY_ID that is provided, if it exists
 *      parameters:
 *          - in: path
 *            name: COMPANY_ID
 *            description: Company id 
 *            required: true
 *            type: string 
 *      responses:
 *          200:
 *              description: Company record found
 *          404:
 *              description: Not a valid COMPANY_ID
 */
app.get('/api/company/:COMPANY_ID', async function(req, res){
	let conn;
	//console.log(req.params);
	try{
		conn = await pool.getConnection();
		row = await conn.query("SELECT * FROM company WHERE COMPANY_ID = ?;",req.params.COMPANY_ID)
		//console.log(row);
		res.setHeader('cache-control', ['max-age=4','public'])
		res.json(row);
	}catch(err){
		throw err;
	}finally{
		if(conn) return conn.release();
	}
});

/**
 * @swagger
 * /api/daysorder:
 *    get:
 *      description: Return all daysorder details
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Array of all the daysorder objects
 */
app.get('/api/daysorder', async function(req, res){
        let conn;
        try{
                conn = await pool.getConnection();
                rows = await conn.query("SELECT * FROM daysorder;");
		res.setHeader('cache-control', ['max-age=4','public'])
                res.json(rows);
        }catch(err){
                throw err;
        }finally{
                if(conn) return conn.release();
        }
});

/**
 * @swagger
 * /api/company/{COMPANY_ID}:
 *    delete:
 *      description: Delete a company record if exists
 *      parameters:
 *          - in: path
 *            name: COMPANY_ID
 *            description: Record id to be deleted
 *            required: true
 *            type: string 
 *      responses:
 *          200:
 *              description: Deleted the company record
 *          404:
 *              description: The id provided is not found
 */ 
app.delete('/api/company/:COMPANY_ID', async function(req, res){
        let conn;
	let checked_id;
	param_id = req.params.COMPANY_ID;

	//sanitization - remove any leading or trailing spaces from path parameter COMPANY_ID
	cleaned_id = param_id.trim()

	//validation - check if the provided COMAPNY_ID is of length 2 and exists in the db
	if(cleaned_id.length == 2){
		conn = await pool.getConnection();
		let sql = "SELECT COMPANY_ID FROM company WHERE COMPANY_ID = ?"; 
            	let check = await conn.query(sql, cleaned_id);
		if(check[0]){	
			checked_id = cleaned_id;
		}
	}
        try{
                conn = await pool.getConnection();
                row = await conn.query("DELETE FROM company WHERE COMPANY_ID = ?;", checked_id);
                res.setHeader('cache-control', ['max-age=4','public']);
                res.json(row);
        }catch(err){
		//console.log(err);
		res.sendStatus(404);
		res.send('Please check if you have provided a valid COMPANY_ID');
                throw err;
        }finally{
                if(conn) return conn.release();
        }
});

/**
 * @swagger
 * /api/company:
 *    post:
 *      description: Post a new company record to db
 *      consumes:
 *          - application/json
 *      parameters:
 *          - in: body
 *            name: Company
 *            decsription: Company to be inserted
 *            required: true
 *            schema:
 *              type: object
 *              required:
 *                  - COMPANY_ID
 *                  - COMPANY_NAME
 *                  - COMPANY_CITY
 *              properties:
 *                  COMPANY_ID:
 *                      type: string
 *                  COMPANY_NAME:
 *                      type: string
 *                  COMPANY_CITY:
 *                      type: string
 *      responses:
 *          200:
 *              description: New company record added to db
 *          409:
 *              description: The COMPANY_ID that is provided is  either already present in the db or of INVALID format (ID length should be 2)
 */
app.post('/api/company',  async function(req, res){
	let conn;
	b_id = req.body.COMPANY_ID;
	b_name = req.body.COMPANY_NAME;
	b_city = req.body.COMPANY_CITY;

	//sanitization - remove any leading or trailing spaces
	cleaned_id = b_id.trim();
	cleaned_name = b_name.trim();
	cleaned_city = b_city.trim();

	//validation - check if the COMPANY_ID is of length 2
	if(cleaned_id.length == 2){
		conn = await pool.getConnection();
    		let sql = "SELECT COMPANY_ID FROM company WHERE COMPANY_ID = ?"; 
    		let val = [cleaned_id];
    		let check = await conn.query(sql, val);

		//validation - check if the COMPANY_ID provided by the user is already present in the db
		if(!check[0]){
			COMPANY_ID = cleaned_id;
                	COMPANY_NAME = cleaned_name;
                	COMPANY_CITY = cleaned_city;
		}
	}	
	try{
        	conn = await pool.getConnection();
        	post = await conn.query("INSERT INTO company VALUES (?, ?, ?)",[COMPANY_ID, COMPANY_NAME, COMPANY_CITY]);
        	res.json(post);
	}catch(err){
		res.sendStatus(409);
		throw err;
	 }finally{
		if(conn) return conn.release();
	 }
});

/**
 * @swagger
 * /api/company/{COMPANY_ID}:
 *    put:
 *      description: Update a company record if exists, else insert the record to db
 *      consumes:
 *          - application/json
 *      parameters:
 *          - in: path
 *            name: COMPANY_ID
 *            description: Comapny id of the record to be updated
 *            required: true
 *            type: string 
 *          - in: body
 *            name: Company
 *            decsription: Company to be updated/inserted
 *            required: true
 *            schema:
 *              type: object
 *              required:
 *                  - COMPANY_ID
 *                  - COMPANY_NAME
 *                  - COMPANY_CITY
 *              properties:
 *                  COMPANY_ID:
 *                      type: string
 *                  COMPANY_NAME:
 *                      type: string
 *                  COMPANY_CITY:
 *                      type: string
 *      responses:
 *          200:
 *              description: Updated/Inserted the company record
 *          422:
 *              description: The provided id for the company not valid
 */
app.put('/api/company/:id', async function(req, res){
	let conn;
	let reslt;
	param_id = req.params.id;
	
	//sanitization - remove any leading or trailing spaces
	cleaned_param_id = param_id.trim();
	cleaned_company_id = req.body.COMPANY_ID.trim();
	cleaned_name = req.body.COMPANY_NAME.trim();
	cleaned_city = req.body.COMPANY_CITY.trim();	
	
	//validation
	if(cleaned_param_id.length == 2 && cleaned_company_id.length == 2){
		COMPANY_ID = cleaned_company_id;
		COMPANY_NAME = cleaned_name;
		COMPANY_CITY = cleaned_city;
	}
	try{
		conn = await pool.getConnection();
		let sql = "SELECT COMPANY_ID FROM company WHERE COMPANY_ID = ?";
		check = await conn.query(sql, [cleaned_param_id]);
		//console.log('returned val = ', check[0]);
		if(check[0]){
			let sql = "UPDATE company SET COMPANY_ID = ?, COMPANY_NAME = ?, COMPANY_CITY = ?  WHERE COMPANY_ID = ?";
                        let val = [COMPANY_ID, COMPANY_NAME, COMPANY_CITY, cleaned_param_id];
                        reslt = await conn.query(sql, val);
		}else{
			let sql = "INSERT INTO company VALUES (?, ?, ?)";
			let val = [COMPANY_ID, COMPANY_NAME, COMPANY_CITY];
			reslt = await conn.query(sql, val);
		}
		res.json(reslt);
	}catch(err){
		res.sendStatus(422);
		throw err;
	}finally{
		if(conn) return conn.release();
	}
});

 /**
 * @swagger
 * /api/company/{COMPANY_ID}:
 *    patch:
 *      description: Update only the specified fields of a company record if it exists
 *      parameters:
 *          - in: path
 *            name: COMPANY_ID
 *            description: Comapny id of the record to be updated
 *            required: true
 *            type: string 
 *          - in: body
 *            name: json patch
 *            decsription: Fields of the company record to be updated
 *            required: true
 *            schema:
 *              $ref: "#/definitions/PatchRequest"
 *      responses:
 *          200:
 *              description: Updated the company record
 *          404:
 *              description: The provided id for the company is not found
 * definitions:
 *  PatchRequest:
 *      type: array
 *      items:
 *          $ref: "#/definitions/PatchDocument"
 *  PatchDocument: 
 *      description: A JSONPatch document as defined by RFC 6902 
 *      required:
 *          - "op"
 *          - "path"
 *      properties: 
 *          op:
 *              type: string 
 *              description: The operation to be performed
 *              enum:
 *                  - "replace"
 *          path: 
 *              type: string
 *              description: A JSON-Pointer for the field to be updated, for example - "/COMPANY_NAME"
 *          value:
 *              type: string
 *              description: The value to be used within the operations, for example - "new value"
 */
app.patch('/api/company/:id', async function(req, res){
	let conn;
	let upd;
	param_id = req.params.id;

        //sanitization - remove any leading or trailing spaces
        cleaned_param_id = param_id.trim();	
	
	//validation
	if(cleaned_param_id.length == 2){
		comp_id = cleaned_param_id;
		reqBody_obj = req.body;
	}
	try{
		conn = await pool.getConnection();
		let sql = "SELECT * FROM company WHERE COMPANY_ID = ?";
        	let obj = await conn.query(sql, [comp_id]);
		//****Using json-patch library****
		reslt = jsonpatch.apply(obj[0], reqBody_obj);
		COMPANY_ID = reslt['COMPANY_ID'];
		COMPANY_NAME = reslt['COMPANY_NAME'];
		COMPANY_CITY = reslt['COMPANY_CITY'];
		let updateSql = "UPDATE company SET COMPANY_ID = ?, COMPANY_NAME = ?, COMPANY_CITY = ?  WHERE COMPANY_ID = ?";
                let val = [COMPANY_ID, COMPANY_NAME, COMPANY_CITY, comp_id];
                patched = await conn.query(updateSql, val);
		res.json(patched);
	}catch(err){
		res.sendStatus(404);
		throw err;
	}finally{
		if(conn) return conn.release();
	}

	/*try{
		conn = await pool.getConnection();
		//if(req.body){
		//	let sql = "UPDATE company SET ? WHERE COMPANY_ID = ?";
                //        let val = [req.body, req.params.id];
                //        upd = await conn.query(sql, val);
		//}
		if(req.body && req.body.COMPANY_NAME && req.body.COMPANY_CITY){
			let sql = "UPDATE company SET COMPANY_NAME = ?, COMPANY_CITY = ?  WHERE COMPANY_ID = ?";
			let val = [req.body.COMPANY_NAME, req.body.COMPANY_CITY, req.params.id];
			upd = await conn.query(sql, val);
		}else if(req.body && req.body.COMPANY_ID && req.body.COMPANY_CITY){
			let sql = "UPDATE company SET COMPANY_ID = ?, COMPANY_CITY = ?  WHERE COMPANY_ID = ?";
                        let val = [req.body.COMPANY_ID, req.body.COMPANY_CITY, req.params.id];
                        upd = await conn.query(sql, val);
		}else if(req.body && req.body.COMPANY_ID && req.body.COMPANY_NAME){
                        let sql = "UPDATE company SET COMPANY_ID = ?, COMPANY_NAME = ?  WHERE COMPANY_ID = ?";
                        let val = [req.body.COMPANY_ID, req.body.COMPANY_NAME, req.params.id];
                        upd = await conn.query(sql, val);
                }else if(req.body && req.body.COMPANY_ID && req.body.COMPANY_NAME &&  req.body.COMPANY_CITY){
                        let sql = "UPDATE company SET COMPANY_ID = ?, COMPANY_NAME = ?, COMPANY_CITY = ?  WHERE COMPANY_ID = ?";
                        let val = [req.body.COMPANY_ID, req.body.COMPANY_NAME, req.body.COMPANY_CITY, req.params.id];
                        upd = await conn.query(sql, val);
                }else if(req.body && req.body.COMPANY_ID){
                        let sql = "UPDATE company SET COMPANY_ID = ?  WHERE COMPANY_ID = ?";
                        let val = [req.body.COMPANY_ID, req.params.id];
                        upd = await conn.query(sql, val);
                }else if(req.body && req.body.COMPANY_NAME){
                        let sql = "UPDATE company SET COMPANY_NAME = ?  WHERE COMPANY_ID = ?";
                        let val = [req.body.COMPANY_NAME, req.params.id];
                        upd = await conn.query(sql, val);
                }else if(req.body && req.body.COMPANY_CITY){
                        let sql = "UPDATE company SET COMPANY_CITY = ?  WHERE COMPANY_ID = ?";
                        let val = [req.body.COMPANY_CITY, req.params.id];
                        upd = await conn.query(sql, val);
                }
		res.json(upd);		
	}catch(err){
		throw err;
	}finally{
		if(conn) return conn.release();
	}*/
});


app.get('/api/say', (req, res) => {
	param = req.query.keyword;
	//console.log(param);
	if(!param){	
		param='';	//so as to not display 'undefined'
	}
	axios(
		{
			method: 'get',
			url: `https://us-east1-idyllic-root-296404.cloudfunctions.net/function-say?keyword=${param}`
		}
	).then((response) => {
		res.send(response.data);
		//console.log(response);
	}).catch((err) => {
		throw err;
	});
});

app.listen(port, () => {
	console.log(`app listening at http://localhost:${port}`)
});
