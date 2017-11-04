
var should = require("should");
var testConfig = require("../../../config");
var agent = require("supertest")(testConfig.app);
var util = require('util');

describe("get config of system",function(){
    before(function(done){
        done();
    });

    describe('it should be ok.', function () {
        it('should be ok ', function (done) {
            agent.get('/v1/system-config')
            .set('content-type', 'application/json')
            .set('x-company-code', 'QNET')
            .set('x-request-id', '8bf14a542d5847bbb880039a59bf23421')
            .end(function(err, res) {
                if(err)
                    return done(err);

                if(res.body.meta.code !== 200 && res.body.meta.error)
                    return done(new Error(JSON.stringify(res.body.meta.error)));

                console.log("res.body:", JSON.stringify(res.body));
                done();
            });
        });
    });

    after(function(done){
        done();
    });
});