'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const methodOverride = require('method-override');
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);

const PORT = process.env.PORT;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('./public')); 
app.set('view engine', 'ejs');

app.get('/',homePage);
app.get('/fav/:digimon_id',addToFav);
app.get('/fav',favPage);
app.get('/detail/:digimon_id',detailPage);
app.delete('/delete/:digimon_id',deleteDigimon);
app.put('/update/:digimon_id',updateDigimonData);
app.get('/search',searchPage);
app.post('/result',resultPage);

let digimonArray = [];
function homePage(req,res){
    let url = 'https://digimon-api.herokuapp.com/api/digimon';
    superagent.get(url)
    .then(result =>{
        let data = result.body;
        digimonArray = data.map(val =>{
            return new Digimon(val);
        });

    });
    res.render('index',{data: digimonArray});
}
function addToFav(req,res){
    let id = req.params.digimon_id;
    let SQL = 'INSERT INTO digimon (name,img,level) VALUES ($1,$2,$3);';
    let safeValues = [digimonArray[id].name,digimonArray[id].img,digimonArray[id].level];
    client.query(SQL,safeValues)
    .then(() =>{
        SQL = 'SELECT * FROM digimon;';
        client.query(SQL)
        .then(result =>{
            res.render('favorite',{data: result.rows})
        })
    })
}
function favPage(req,res){
    let SQL = 'SELECT * FROM digimon;';
    client.query(SQL)
    .then(result =>{
        res.render('favorite',{data: result.rows})
    }) 
}
function detailPage(req,res){
    let id = req.params.digimon_id;
    let SQL = 'SELECT * FROM digimon WHERE id=$1;';
    let safeValues = [id];
    client.query(SQL,safeValues)
    .then(result =>{
        res.render('details',{data: result.rows[0]});
    })
}
function deleteDigimon(req,res){
    let id = req.params.digimon_id;
    let SQL = 'DELETE FROM digimon WHERE id=$1;';
    let safeValues = [id];
    client.query(SQL,safeValues)
    .then(() =>{
        favPage(req,res);
    })
}
function updateDigimonData(req,res){
    let id = req.params.digimon_id;
    let name = req.body.name;
    let img = req.body.img;
    let level = req.body.level;
    let SQL = 'UPDATE digimon SET name=$1,img=$2,level=$3 WHERE id=$4;';
    let safeValues = [name,img,level,id];
    client.query(SQL,safeValues)
    .then(() =>{
        detailPage(req,res);
    });
}
function searchPage(req,res){
    res.render('search');
}
function resultPage(req,res){
    let title = req.body.title;
    let choose = req.body.choose;
    let url = `https://digimon-api.herokuapp.com/api/digimon/${choose}/${title}`;
    superagent.get(url)
    .then(result =>{
        res.render('result',{data: result.body});
    })
}


function Digimon(data){
    this.name = data.name || 'no name';
    this.img = data.img || '';
    this.level = data.level || '//';
}




client.connect()
.then(() =>{
    app.listen(PORT,() =>{
        console.log(`listen ${PORT}`);
    });
});