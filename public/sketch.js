var s, r, b, g, bs, e, rs, gs, bsl, ss, esp, div; // html stuffz

var users = new Map();
var pos = [];
var buffer = "";
var username;
var beginDraw = false;
var started = false;
var returned = false;
var colored = false;

function keyPressed() {
    if (!username && buffer.length > 4) {
        if (keyCode == ENTER || keyCode == RETURN) {
            returned = true;
        } else if (keyCode == BACKSPACE) {
            buffer = buffer.substring(0, buffer.length - 1);
        }
    }
}

function keyTyped() {
    if (!username && buffer.length < 30 && keyCode != BACKSPACE && keyCode != ENTER && keyCode != RETURN) {
        buffer += key;
    }
}

function sendColor() {
    var data = {
        r: r.value(),
        g: g.value(),
        b: b.value(),
        size: bsl.value(),
        username: username
    };
    users.set(username, data);
    s.emit('color', data);
    redrawList();
    colored = true;
}

function redrawList() {
    rectMode(CORNERS);
    fill(255);
    noStroke();
    rect(-300, 0, 0, height);
    var iterations = 1;
    users.forEach(function(v, k) {
        rectMode(CORNER);
        textSize(20);
        fill(v.r, v.g, v.b, 100);
        stroke(51);
        text(k, -270, iterations * 20);
        stroke(v.r, v.g, v.b);
        ellipse(-285, iterations * 20 - 10, v.size, v.size);
        iterations++;
    });
}

function setup() {
    createCanvas(1200, 900);
    translate(300, 0);
    div = createDiv();
    rs = createSpan('<br />R: ');
    r = createSlider(0, 255, 255);
    r.changed(sendColor);
    gs = createSpan('<br />G: ');
    g = createSlider(0, 255, 255);
    g.changed(sendColor);
    bs = createSpan('<br />B: ');
    b = createSlider(0, 255, 255);
    b.changed(sendColor);
    ss = createSpan('<br />Brush: ');
    bsl = createSlider(1, 20, 10);
    bsl.changed(sendColor);
    esp = createSpan('<br />Erase: ');
    e = createCheckbox();
    rs.parent(div);
    r.parent(rs);
    gs.parent(div);
    g.parent(gs);
    bs.parent(div);
    b.parent(bs);
    ss.parent(div);
    bsl.parent(ss);
    e.parent(esp);
    esp.parent(div);
    div.addClass('holder');
    pixelDensity();
    background(51);
    // s.on('erase', function(data) {
    //     console.log(data);
    //     noStroke();
    //     fill(51);
    //     ellipse(data.x, data.y, 10, 10);
    // });
}

function mousePressed() {
    mouseDragged();
}

function mouseDragged() {
    if (!beginDraw) {
        return;
    }
    if (mouseX > width || mouseX - 300 < 0 || mouseY > height || mouseY < 0) {
        return;
    }
    if (!e.checked()) {
        fill(r.value(), g.value(), b.value(), 100);
        s.emit('mouse', {
            x: mouseX - 300,
            y: mouseY,
            r: r.value(),
            g: g.value(),
            b: b.value(),
            a: false,
            size: bsl.value()
        });
        noStroke();
        ellipse(mouseX - 300, mouseY, bsl.value(), bsl.value());
        return;
    }
    fill(51, 51, 51);
    s.emit('mouse', {
        x: mouseX - 300,
        y: mouseY,
        r: r.value(),
        g: g.value(),
        b: b.value(),
        a: true,
        size: bsl.value()
    });
    noStroke();
    ellipse(mouseX - 300, mouseY, bsl.value(), bsl.value());
}

function draw() {
    document.body.style.background = "rgb(" + r.value() + "," + g.value() + "," + b.value() + ")";
    rs.style("background", "rgb(" + r.value() + "," + g.value() + "," + b.value() + ")");
    gs.style("background", "rgb(" + r.value() + "," + g.value() + "," + b.value() + ")");
    bs.style("background", "rgb(" + r.value() + "," + g.value() + "," + b.value() + ")");
    if (returned) {
        if (!s) {
            s = io.connect(window.location.host);
            s.on('mouse', function(data) {
                noStroke();
                if (!data.a) {
                    fill(data.r, data.g, data.b, 100);
                    ellipse(data.x, data.y, data.size, data.size);
                } else {
                    fill(51, 51, 51);
                    ellipse(data.x, data.y, data.size, data.size);
                }
            });
            s.on('pos', function(data) {
                pos.push(data);
            });
            s.on('clear', function(data) {
                background(51);
            });
            s.on('color', function(data) {
                users.set(data.username, data);
                redrawList();
            });
            s.on('disconnect', function(data) {
                users.delete(data.username);
                redrawList();
            });
            s.on('begin', function(data) {
                if (data.clear) {
                    background(51);
                }
                pos.forEach(function(data) {
                    noStroke();
                    if (!data.a) {
                        fill(data.r, data.g, data.b, 100);
                        ellipse(data.x, data.y, data.size, data.size);
                    } else {
                        fill(51, 51, 51);
                        ellipse(data.x, data.y, data.size, data.size);
                    }
                });
                redrawList();
                beginDraw = true;
            });
            s.on('nameCheck', function(data) {
                if (data.has) {
                    alert('Username taken!');
                    started = false;
                    returned = false;
                    buffer = "";
                    return;
                }
                username = buffer;
                sendColor();
                s.emit('download', {});
            });
            s.on('update', function(data) {
                alert('RidiciCanvas was updated!');
                window.location.reload(true);
            });
        }
        if (!started) {
            s.emit('checkName', {
                name: buffer
            });
            started = true;
        }
        // if (colored) {
        //     if (frameCount % 60 === 0) {
        //         s.emit('name', {
        //             r: r.value(),
        //             g: g.value(),
        //             b: b.value(),
        //             size: bsl.value(),
        //             username: username
        //         });
        //     }
        // }
    }
    if (!username) {
        background(255);
        stroke(200);
        strokeWeight(5);
        rectMode(CENTER);
        textAlign(CENTER);
        rect(width / 2 - 300, height / 2, width / 2, 30);
        noStroke();
        textSize(20);
        text("Username: ", width / 4 - 200, height / 2 - 30);
        if (returned) {
            text('Waiting for server!', width / 2 - 300, height / 2 + 5);
        } else {
            text(buffer, width / 2 - 300, height / 2 + 5);
        }
        rectMode(CORNER);
    }
    if (!beginDraw && username) {
        textSize(25);
        background(51);
        fill(255);
        textAlign(CENTER);
        text('Downloading canvas..', width / 2 - 300, height / 2);
        return;
    }
    // background(51);

}
