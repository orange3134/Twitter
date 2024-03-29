// Search for Tweets within the past seven days
// https://developer.twitter.com/en/docs/twitter-api/tweets/search/quick-start/recent-search
require('dotenv').config();
const needle = require('needle');
const json2emap = require("json2emap");

var express = require("express");
var app = express();
var port = process.env.PORT || 3000;

const token = process.env.BEARER_TOKEN;
const endpointUrl = "https://api.twitter.com/2/tweets/search/recent";

var query = {
    'tweet.fields': 'created_at,public_metrics',
    'expansions': 'author_id,attachments.media_keys',
    'media.fields': 'url',
    'user.fields': 'id,name,username,profile_image_url,url'
};

app.get("/search", async function(req, res) {
    try {
        // Make request
        query['query'] = req.query.query;
        query['max_results'] = (10 <= req.query.max_results && req.query.max_results <= 100 ) ? req.query.max_results : 10;
        console.log(query);
        const response = await getRequest(query);

        if(response.meta.result_count !== 0){
            var responseNeos = formatForNeos(response);
        }else{
            var responseNeos = {response: "Tweet not found"}
        }

        //console.log(responseNeos);
        res.status(200).send(json2emap(responseNeos));
    } catch (e) {
        console.log(e);
    }
});

async function getRequest(query) {

    const params = query;

    const res = await needle('get', endpointUrl, params, {
        headers: {
            "User-Agent": "v2RecentSearchJS",
            "authorization": `Bearer ${token}`
        }
    })

    if (res.body) {
        return res.body;
    } else {
        throw new Error('Unsuccessful request');
    }
}

function formatForNeos(response){
    //Neos用に整形
    response.data.forEach(element => {
        //メディアIDをURLに置き換え
        if(element.attachments !== undefined){

            var media_urls = [];
            element.attachments.media_keys.forEach(key =>{
                var media = response.includes.media.find((media) => media.media_key === key);
                if(media.url !== undefined){
                    media_urls.push(media.url);
                }
            })

            delete element.attachments;
            element.media_urls = media_urls;
        };

        //author_idからユーザー情報を取得
        var author = response.includes.users.find((user) => user.id === element.author_id);
        element.account_name = author.name;
        element.account_id = author.username;
        element.account_icon = author.profile_image_url;
        element.url = author.url;
    });

    data = response.data;

    return data;
}

app.listen(port);
console.log("Server started");