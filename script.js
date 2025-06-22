window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = window.innerHeight - 10;

    class InputHandler {
        constructor(game){
            this.game = game;
            window.addEventListener('click', () =>{
                this.game.player.speedY = 3;
            });
        }
    }
    class Projectile {

    }
    class Particle {

    }
    class Player {
        constructor(game) {
            this.game = game;
            this.width = 100;
            this.height = 100;
            this.x = 250;
            this.y = 50
            this.speedY = 0;

        }
        update(){
            this.y += this.speedY;
            if (this.y + this.height >= this.game.height || this.y + this.height <= 0 + this.height){
                this.speedY *= -1;
            }
        }
        draw(context){
            context.fillStyle = 'gray';
            context.fillRect(this.x,this.y, this.width, this.height);
        }
    }
    class Block {
        constructor(game, x, y, width, height, color){
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.color = color;
            this.hp = 1;
        }
        draw(context){
            context.fillStyle = this.color;
            context.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    class DirtBlock extends Block {
        constructor(game, x, y, width, height) {
            super(game, x, y, width, height, 'green');
            this.type = 'dirt';
            this.hp = 2;
        }
    }
    class EarthBlock extends Block {
        constructor(game, x, y, width, height) {
            super(game, x, y, width, height, 'darkgreen');
            this.type = 'earth';
            this.hp = 3;
        }
    }
    class BlockFactory {
        static createBlock(type, game, x, y, size) {
            switch(type) {
                case 'dirt': return new DirtBlock(game, x, y, size, size);
                case 'earth': return new EarthBlock(game, x, y, size, size);
                default: return new Block(game, x, y, size, size, 'gray');
            }
        }
    }
    class Background {

    }
    class IU {
        constructor(game){
            this.game = game;
            this.fontSize = 16;
            this.fontFamily = 'Roboto';
            this.color = 'white';
        }
    }
    class Game {
        constructor(width, height){
            this.width = width;
            this.height = height;
            this.player = new Player(this);
            this.input = new InputHandler(this);
            this.blockSize = 100;
            this.blocks = [];
            this.generateLayers();
        }
        generateLayers() {
            const layersConfig = [
                {type: 'earth', yOffset: this.height - 3 * this.blockSize},
                {type: 'dirt', yOffset: this.height - 2 * this.blockSize},
                {type: '', yOffset: this.height - 1 * this.blockSize}
            ];
            
            for(let layer of layersConfig) {
                for(let i = 0; i < 6; i++) {
                    let x = i * this.blockSize;
                    let y = layer.yOffset;
                    let block = BlockFactory.createBlock(layer.type, this, x, y, this.blockSize);
                    this.blocks.push(block);
                }
            }
        }
        update(){
            this.player.update();
        }
        draw(context){
            this.player.draw(context);
            this.blocks.forEach(block => block.draw(context));
        }
    }

    const game = new Game(canvas.width, canvas.height);

    function animate(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.update();
        game.draw(ctx);
        requestAnimationFrame(animate);
    }
    animate();
});