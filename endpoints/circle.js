const router = require('express').Router();

const Canvas = require('@napi-rs/canvas');
const request = require('node-superfetch');
const path = require('path');

module.exports = async (req, res) => {
    const { body } = await request.get(req.query.url);
    
    const avatar = await Canvas.loadImage(body);
    const dimensions = avatar.width <= avatar.height ? avatar.width : avatar.height;

    const canvas = Canvas.createCanvas(dimensions, dimensions);
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, (canvas.width / 2) - (avatar.width /2), (canvas.height / 2) - (avatar.height / 2));

    res.header('Content-Type', 'application/json');
    res.send({ success: true, body: new Buffer.from(canvas.toBuffer(), 'base64'), ext: '.png'})
}