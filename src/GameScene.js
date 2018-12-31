var tipoSuelo = 1;
var tipoJugador = 2;
var tipoCaja = 3;



var controles = {};
var teclas = [];


var GameLayer = cc.Layer.extend({
    _emitter: null,
    tiempoEfecto:0,
    space:null,
    jugador: null,
    mapa: null,
    mapaAncho: null,
    muros:[],
    cajas:[],
    formasEliminar:[],
    chocandoMuro:null,
    cont:null,
    ctor:function () {
        this._super();
        var size = cc.winSize;


        cc.spriteFrameCache.addSpriteFrames(res.jugador_subiendo_plist);
        cc.spriteFrameCache.addSpriteFrames(res.jugador_avanzando_plist);
        cc.spriteFrameCache.addSpriteFrames(res.jugador_impactado_plist);
        cc.spriteFrameCache.addSpriteFrames(res.animacion_cuervo_plist);
        cc.spriteFrameCache.addSpriteFrames(res.animaciontigre_plist);
        cc.spriteFrameCache.addSpriteFrames(res.box_red_plist);
        cc.spriteFrameCache.addSpriteFrames(res.box_brown_plist);


        // Inicializar Space
        this.space = new cp.Space();
        this.space.gravity = cp.v(0, 0);
        // Depuración
        this.depuracion = new cc.PhysicsDebugNode(this.space);
        this.addChild(this.depuracion, 10);




        this.space.addCollisionHandler(tipoJugador, tipoCaja,
            null, this.collisionJugadorConCaja.bind(this), null, null);


        this.jugador = new Jugador(this, cc.p(50,250));
        this.cargarMapa();


        // Declarar emisor de particulas (parado)
        this._emitter =  new cc.ParticleGalaxy.create();
        this._emitter.setEmissionRate(0);
        //this._emitter.texture = cc.textureCache.addImage(res.fire_png);
        this._emitter.shapeType = cc.ParticleSystem.STAR_SHAPE;
        this.addChild(this._emitter,10);


        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: this.procesarKeyPressed.bind(this),
            onKeyReleased: this.procesarKeyReleased.bind(this)
        }, this);



        this.cont = 20;

        this.scheduleUpdate();



        return true;
    },update:function (dt) {
        this.jugador.actualizar();

        this.space.step(dt);

        this.procesarControles();


        // Control de emisor de partículas
        if (this.tiempoEfecto > 0){
             this.tiempoEfecto = this.tiempoEfecto - dt;
             this._emitter.x =  this.jugador.body.p.x;
             this._emitter.y =  this.jugador.body.p.y;

        }
        if (this.tiempoEfecto < 0) {
             this._emitter.setEmissionRate(0);
             this.tiempoEfecto = 0;
        }


        this.cont++;


    },cargarMapa:function () {
         this.mapa = new cc.TMXTiledMap(res.mapa1_tmx);
         // Añadirlo a la Layer
         this.addChild(this.mapa);
         // Ancho del mapa
         this.mapaAncho = this.mapa.getContentSize().width;

         var grupoSuelos = this.mapa.getObjectGroup("suelos");
         var suelosArray = grupoSuelos.getObjects();


         for (var i = 0; i < suelosArray.length; i++) {
             var suelo = suelosArray[i];
             var puntos = suelo.polylinePoints;
             for(var j = 0; j < puntos.length - 1; j++){
                 var bodySuelo = new cp.StaticBody();

                 var shapeSuelo = new cp.SegmentShape(bodySuelo,
                     cp.v(parseInt(suelo.x) + parseInt(puntos[j].x),
                         parseInt(suelo.y) - parseInt(puntos[j].y)),
                     cp.v(parseInt(suelo.x) + parseInt(puntos[j + 1].x),
                         parseInt(suelo.y) - parseInt(puntos[j + 1].y)),
                     10);
                 shapeSuelo.setCollisionType(tipoSuelo);
                 this.space.addStaticShape(shapeSuelo);
             }
         }


        var grupoMuros = this.mapa.getObjectGroup("muros");
        var murosArray = grupoMuros.getObjects();
        for (var i = 0; i < murosArray.length; i++) {
            var muro = new Muro(this,
                cc.p(murosArray[i]["x"]+50,murosArray[i]["y"]-50));
            this.muros.push(muro);
        }




        var grupoCajas = this.mapa.getObjectGroup("cajas");
        var cajasArray = grupoCajas.getObjects();
        for (var i = 0; i < cajasArray.length; i++) {
            var caja = new Caja(this,
                cc.p(cajasArray[i]["x"]+50,cajasArray[i]["y"]-50));
            this.cajas.push(caja);
        }



      },
    collisionJugadorConCaja:function (arbiter, space) {

        var shapes = arbiter.getShapes();


        if (controles.moverX > 0) {
            shapes[1].body.p.x=this.jugador.body.p.x + 120;
        }
        if (controles.moverX < 0) {
            shapes[1].body.p.x=this.jugador.body.p.x - 120;
        }

        if (controles.moverY > 0) {
            shapes[1].body.p.y=this.jugador.body.p.y + 120;
        }
        if (controles.moverY < 0) {
            shapes[1].body.p.y=this.jugador.body.p.y - 120;
        }



    },
    procesarKeyPressed(keyCode) {
        var posicion = teclas.indexOf(keyCode);
        if (posicion == -1) {
            teclas.push(keyCode);
            switch (keyCode) {
                case 39:
                    // ir derecha
                    controles.moverX = 1;
                    break;
                case 37:
                    // ir izquierda
                    controles.moverX = -1;
                    break;

                case 38:
                    // ir arriba
                    controles.moverY = 1;
                    break;
                case 40:
                    // ir abajo
                    controles.moverY = -1;
                    break;
            }
        }
    },

    procesarKeyReleased(keyCode) {
        var posicion = teclas.indexOf(keyCode);
        teclas.splice(posicion, 1);
        switch (keyCode) {
            case 39:
                if (controles.moverX == 1) {
                    controles.moverX = 0;
                }
                break;
            case 37:
                if (controles.moverX == -1) {
                    controles.moverX = 0;
                }
                break;

            case 38:
                if (controles.moverY == 1) {
                    controles.moverY = 0;
                }
                break;
            case 40:
                if (controles.moverY == -1) {
                    controles.moverY = 0;
                }
                break;
        }
    },


    procesarControles() {


            if (controles.moverX > 0) {

                //console.log(this.jugador);
                //console.log(this.muros[0]);

                var sigue = true;
                for(var i=0;i<this.muros.length;i++) {

                    console.log("1111")
                    console.log(i)
                    console.log(this.muros[i].body.p.x - this.jugador.body.p.x)
                    if ( ( Math.abs(this.jugador.body.p.y - this.muros[i].body.p.y)  <= 10 )
                        && ( this.muros[i].body.p.x - this.jugador.body.p.x <= 110 )
                        && ( this.muros[i].body.p.x - this.jugador.body.p.x > 0 ))
                        sigue = false
                }

                if(this.cont>=20 && sigue) {
                    this.cont =0;
                    this.jugador.body.p.x += 100;
                }

            }

            if (controles.moverX < 0) {

                var sigue = true;
                for(var i=0;i<this.muros.length;i++) {

                    console.log("2222")
                    console.log(this.jugador.body.p.x - this.muros[i].body.p.x)
                    if ( ( Math.abs(this.jugador.body.p.y - this.muros[i].body.p.y)  <=10 )
                        && ( this.jugador.body.p.x - this.muros[i].body.p.x <= 110 )
                        && ( this.jugador.body.p.x - this.muros[i].body.p.x > 0 ))
                        sigue = false
                }

                if(this.cont>=20 && sigue) {
                    this.cont =0;
                    this.jugador.body.p.x -= 100;
                }


            }


            if (controles.moverY > 0) {

                var sigue = true;
                for(var i=0;i<this.muros.length;i++) {

                    console.log("3333")
                    console.log(this.muros[i].body.p.y - this.jugador.body.p.y)
                    if ( ( this.muros[i].body.p.y - this.jugador.body.p.y  <=110 )
                        && Math.abs(this.muros[i].body.p.x - this.jugador.body.p.x) <= 10
                        && ( this.muros[i].body.p.y - this.jugador.body.p.y  > 0) )
                        sigue = false
                }

                if(this.cont>=20 && sigue) {
                    this.cont =0;
                    this.jugador.body.p.y += 100;
                }

            }
            if (controles.moverY < 0) {

                var sigue = true;
                for(var i=0;i<this.muros.length;i++) {

                    console.log("4444")
                    console.log(this.jugador.body.p.y - this.muros[i].body.p.y)
                    if ( ( this.jugador.body.p.y - this.muros[i].body.p.y  <=110 )
                        && (Math.abs(this.muros[i].body.p.x - this.jugador.body.p.x) <= 10 )
                        && ( this.jugador.body.p.y - this.muros[i].body.p.y  > 0 ) )
                        sigue = false
                }

                if(this.cont>=20&& sigue) {
                    this.cont =0;
                    this.jugador.body.p.y -= 100;
                }

            }



    },

});

var idCapaJuego = 1;

var GameScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        var layer = new GameLayer();
        this.addChild(layer, 0, idCapaJuego);

    }
});
