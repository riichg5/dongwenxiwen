var should = require("should");
var testConfig = require("../../../../config");
var agent = require("supertest")(testConfig.app);
var util = require('util');
let BLL = require()

describe("get top article",function(){
    before(function(done){
        done();
    });

    describe('it should be ok.', function () {
        it('should be ok ', function (done) {
            agent.get('/v1/articles/tops/1')
            .send({})
            .end(function(err, res) {
                if(err){
                    return done(err);
                }

                console.log("res.body:", JSON.stringify(res.body));
                done();
            });
        });
    });

    after(function(done){
        done();
    });
});