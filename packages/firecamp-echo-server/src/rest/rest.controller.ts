import * as rawBody from 'raw-body';
import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Put, Query, Req, Response, HttpStatus, HttpCode, Patch, Delete, Head, Ip } from '@nestjs/common';
import * as crypto from 'crypto'
import { response } from 'express';
import * as Hawk from 'hawk'
import { Credentials } from 'hawk/lib/server';
const username = 'firecamp'
const password = 'password'
const nonce = crypto.randomBytes(16).toString('base64')
@Controller('')
export class RestController {

    /** Methods  */

    @Get('get')
    get(
        @Req() req,
        @Query() queryParams,
        @Headers() headers
    ) {
        const url = `${req.protocol}://${req.get('Host')}${req.originalUrl}`
        const method = 'GET';
        return { url, method, args: queryParams, headers }
    }

    @Post('post')
    @HttpCode(HttpStatus.OK)
    async post(
        @Req() req,
        @Body() body,
        @Headers('Content-Type') ct,
        @Headers() headers
    ) {
        const url = `${req.protocol}://${req.get('Host')}${req.originalUrl}`
        const method = 'POST';
        if (req.readable) {
            // body is ignored by NestJS -> get raw body from request
            const raw = await rawBody(req);
            body = raw.toString().trim();
        }
        let data= {};
        let form = {};
        if(ct == 'application/x-www-form-urlencoded') form = body;
        else data = body
        return { url, method, form, data, headers }
    }

    @Put('put')
    async put(
        @Req() req,
        @Body() body,
        @Headers('Content-Type') ct,
        @Headers() headers
    ) {
        const url = `${req.protocol}://${req.get('Host')}${req.originalUrl}`
        const method = 'PUT';
        if (req.readable) {
            // body is ignored by NestJS -> get raw body from request
            const raw = await rawBody(req);
            body = raw.toString().trim();
        }
        let data= {};
        let form = {};
        if(ct == 'application/x-www-form-urlencoded') form = body;
        else data = body
        return { url, method, form, data, headers }
    }

    @Patch('patch')
    async patch(
        @Req() req,
        @Body() body,
        @Headers('Content-Type') ct,
        @Headers() headers
    ) {
        const url = `${req.protocol}://${req.get('Host')}${req.originalUrl}`
        const method = 'PATCH';
        if (req.readable) {
            // body is ignored by NestJS -> get raw body from request
            const raw = await rawBody(req);
            body = raw.toString().trim();
        }
        
        let data= {};
        let form = {};
        if(ct == 'application/x-www-form-urlencoded') form = body;
        else data = body
        return { url, method, form, data, headers }
    }

    @Delete('delete')
    async delete(
        @Req() req,
        @Body() body,
        @Headers('Content-Type') ct,
        @Headers() headers
    ) {
        const url = `${req.protocol}://${req.get('Host')}${req.originalUrl}`
        const method = 'PATCH';
        if (req.readable) {
            // body is ignored by NestJS -> get raw body from request
            const raw = await rawBody(req);
            body = raw.toString().trim();
        }
        
        let data= {};
        let form = {};
        if(ct == 'application/x-www-form-urlencoded') form = body;
        else data = body
        return { url, method, form, data, headers }
    }


    /** Headers */

    @Get('headers')
    headers(
        @Req() req,
        @Headers() headers
    ) {
        // const url = `${req.protocol}://${req.get('Host')}${req.originalUrl}`
        // const method = 'GET';
        return { headers }
    }

    @Get('response-headers')
    responseHeaders(
        @Req() req,
        @Query() queryParams,
        // @Headers() headers,
        @Response() res
    ) {
        // console.log(queryParams)
        Object.keys(queryParams).map((k, i)=> {
            res.header(k, queryParams[k]);
        })
        return res.json(queryParams);
    }

    /** Authentication Methods */

    // Basic Auth
    @Get('basic-auth')
    basicAuth(@Query() queryParams, @Headers() headers) {
        if (!('authorization' in headers )){
            return {authenticated:false}
        }
        const split = headers.authorization.split(" ")
        const type = split[0]
        if (type != 'Basic'){
            return {authenticated:false}
        }
        const decoded = Buffer.from(split[1], 'base64').toString()
        const decodedSplit = decoded.split(':')
        if (decodedSplit.length != 2){
            return {authenticated:false}
        }
        const username = decodedSplit[0]
        const password = decodedSplit[1]
        console.log(username, password)
        
        return { authenticated: true }
    }

    // Digest Auth
    @Get('digest-auth')
    digestAuth(@Req() req,@Headers() headers, @Response() res) {
        const realm = 'Users'

        if (!('authorization' in headers)){
            res.set({'www-authenticate':`Digest realm="${realm}", nonce="${nonce}"`}).status(401);
            return res.json('Unauthorized')
        }

        const split = headers.authorization.replace(',','').split(" ")
        const type = split[0]
        if (type != 'Digest'){
            return res.json('Unauthorized')
        }
        const {authorization} = headers
        
        const authArgs = authorization.slice(7).split(', ')
        const argsMap = {}
        console.log(authArgs)   
        authArgs.forEach(arg => {
            const split = arg.replaceAll('"','').replace('=', '-:-').split('-:-')
            argsMap[split[0]] = split[1]
        })
        console.log(argsMap)
        
        if (!(argsMap['username'] && argsMap['nonce'] && argsMap['realm'] && argsMap['response'])){
            return res.json({"authorized": false})
        }
        const HA1 = crypto.createHash('md5').update(`${argsMap['username']}:${argsMap['realm']}:${password}`).digest('hex')
        const HA2 = crypto.createHash('md5').update(`GET:/digest-auth`).digest('hex')
        const responseCheck = crypto.createHash('md5').update(`${HA1}:${argsMap['nonce']}:${HA2}`).digest('hex')

        return res.json({"authorized":responseCheck===argsMap['response']})
    }

    // Hawk Auth
    @Get('hawk-auth')
    async hawkAuth(@Req() req, @Response() res) {
        const credentialsFunc = function (id) {

            if (id !=='dh37fgj492je'){
                return undefined
            }
            
            const credentials:Credentials = {
                key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                algorithm: 'sha256',
                user: 'Steve'
            };
        
            return credentials;
        };

        let status, message

        try {
            const { credentials, artifacts } = await Hawk.server.authenticate(req, credentialsFunc)
            message = {'message':"Hawk Authentication Successfull"}
            console.log()
            status = 200;
            const header = Hawk.server.header(credentials, artifacts);
            
            res.set({'Server-Authorization':header})
        } catch (error) {
            message = error.output.payload;
            status = 401;
            const header = error.output.headers
            res.set(header)
        }

        return res.status(status).json(message)
    }

    // OAuth 1.0
    @Get('oauth1')
    OAuth1() {
        return 'yet to implement'
        // return { authenticated: true }
    }

    /** Cookies Manipulation*/

    // set cookie
    @Get('cookies/set')
    cookieSet(@Query() queryParams, @Response() res) {
        
        const payload = {cookies:{}}

        Object.entries(queryParams).forEach((param) => {
            const [key, value] = param
            payload.cookies[key] = value
            res.cookie(key, value)
        
        })
        console.log(res.cookies)
        return res.json(payload)
    }

    // get cookie
    @Get('cookies')
    cookieGet(@Req() req) {
        console.log(req.cookies)
        return 'yet to implement'
    }

    // delete cookie
    @Get('cookies/delete')
    cookieDelete(@Req() req, @Query() queryParameters, @Response() res) {
        
        const cookies = {...req.cookies}
        console.log(cookies)
        
        Object.keys(queryParameters).forEach(key => {
            res.clearCookie(key)
            delete cookies[key]
        });
        
        return res.json(cookies)
    }

    /** Utilities */

    // Response Status Code
    @Get('status/:status')
    status(
        @Param('status') status,
        @Response() res
    ) {
        try {
            return res.status(status).json({ status })
        } catch (e) {
            throw new BadRequestException(e);
        }
    }

    // Streamed Response
    @Get('stream/:chunk')
    stream(
        @Param('chunk') chunk,
        @Response() res
    ) {
        return 'yet to implement'
    }

    // Delayed Response
    @Get('delay/:seconds')
    delay(
        @Param('seconds') seconds,
        @Response() res
    ) {

        seconds = +seconds;
        if (typeof seconds != 'number') throw new BadRequestException('Seconds not valid')
        setTimeout(() => {
            return res.json({ delay: seconds, in: 'seconds' })
        }, seconds * 1000);
    }

    // Get UTF8 Encoded Response
    @Get('encoding/utf8')
    encoding() {
        return 'yet to implement'
    }

    // GZip Compressed Response
    @Get('gzip')
    gzip() {
        return 'yet to implement'
    }

    // Deflate Compressed Response
    @Get('deflate')
    deflate() {
        return 'yet to implement'
    }

    //IP address in JSON format
    @Get('ip')
    ip(@Ip() ip) {
        return {'ip': ip}
    }

    /** Utilities / Date and Time */
    // 1. Current UTC time
    // 2. Timestamp validity
    // 3. Format timestamp
    // 4. Extract timestamp unit
    // 5. Time addition
    // 6. Time subtraction
    // 7. Start of time
    // 8. Object representation
    // 9. Before comparisons
    // 10. After comparisons
    // 11. Between timestamps
    // 12. Leap year check

    /** Auth: Digest */
    // 1. DigestAuth Request
}
