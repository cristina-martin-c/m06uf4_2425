const PORT = 7777;

let http = require ('http');
let static = require('node-static');
let ws = require('ws');

let file = new static.Server('./public');

let http_server = http.createServer(function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(PORT);

let ws_server = new ws.Server({server: http_server});

let player1, player2;
let spectators = [];  

ws_server.on('connection', function (conn){
    console.log("Usuario conectado");

    if (player1 == null){
        // Conectar al jugador 1
        player1 = conn;

        let info = {
            player_num: 1
        };

        player1.send(JSON.stringify(info));

        player1.on('close', function(){
            console.log("Player 1 disconnected");
            if(player2){
				let info = {
					player_disconnected: true
				};
				player2.send(JSON.stringify(info));
				broadcastToSpectators(info);
			}
			player1 = null;
        });

        player1.on('message', function (msg){
            if (player2 == null) return;

            let info = JSON.parse(msg);

            if (info.y != null || info.by != null){
                player2.send(JSON.stringify(info));
                broadcastToSpectators(info);  
            }
            else if (info.s1 != null){
                player2.send(JSON.stringify(info)); 
                broadcastToSpectators(info); 
            }
        });
    }
    else if (player2 == null){
        // Conectar al jugador 2
        player2 = conn;

        let info = {
            player_num: 2
        };

        player2.send(JSON.stringify(info));

        player2.on('close', function(){
            console.log("Player 2 disconnected");
            if(player1){
				let info = {
					player_disconnected:true
				};
				player1.send(JSN.stringify(info));
				broadcastToSpectators(info);
			}
			player2 = null;
        });

        setTimeout(function(){
            if (player1 && player2) {
                let info = {
                    game_start: true
                };
                let info_json = JSON.stringify(info);
                player1.send(info_json);
                player2.send(info_json);
            }
        }, 500);

        player2.on('message', function (msg){
            if (player1 == null) return;

            let info = JSON.parse(msg);

            if (info.y != null || info.by != null){
                player1.send(JSON.stringify(info));
                broadcastToSpectators(info); 
            }
        });
    }
    else {
        spectators.push(conn);
        console.log("Nuevo espectador conectado");

        let gameState = {
            game_start: true,
            player1_score: 0,
            player2_score: 0
        };
        conn.send(JSON.stringify(gameState));

        conn.on('close', function () {
            console.log("Espectador desconectado");
            spectators = spectators.filter(s => s !== conn);
        });
    }
});

function broadcastToSpectators(message) {
    spectators.forEach(s => s.send(JSON.stringify(message)));
}

