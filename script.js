window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = window.innerHeight - 10;

    class InputHandler {
        constructor(game){
            this.game = game;
            window.addEventListener('click', () =>{
                const angle = (Math.random() * 120 + 30) * Math.PI / 180;
                const speed = 10;
                this.game.player.speedX = Math.cos(angle) * speed;
                this.game.player.speedY = Math.sin(angle) * speed;
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
            this.speedX = 0;
        }
        update(){
            this.y += this.speedY;
            this.x += this.speedX;
            if (this.x + this.width >= this.game.width || this.x <= 0){
                this.speedX *= -1;
            }
            if (this.y <= 0) this.speedY *= -1;
            this.game.blocks = this.game.blocks.filter(block => {
                if (this.cheakCollision(block)) {
                    block.hp--;
                    if (this.speedY > 0 && this.y + this.height - this.speedY <= block.y) {
                        this.speedY *= -1;
                    } 
                    return block.hp > 0;
                }
                return true;
            })
        }
        draw(context){
            context.fillStyle = 'gray';
            context.fillRect(this.x,this.y, this.width, this.height);
        }
        
        cheakCollision(block) {
            return (
                this.x < block.x + block.width &&
                this.x + this.width > block.x &&
                this.y < block.y + block.height &&
                this.y + this.height > block.y
            )
        }
    }
    class Block {
        constructor(game, x, y, width, height, color, border = null){
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.border = border;
            this.color = color;
            this.hp = 1;
        }
        draw(context){
            context.fillStyle = this.color;
            context.fillRect(this.x, this.y, this.width, this.height);

            if (this.border) {
                context.strokeStyle = this.border;
                context.strokeRect(this.x, this.y, this.width, this.height);
            }
        }
    }
    class DirtBlock extends Block {
        constructor(game, x, y, width, height) {
            super(game, x, y, width, height, 'green', 'red');
            this.type = 'dirt';
            this.hp = 2;
        }
    }
    class EarthBlock extends Block {
        constructor(game, x, y, width, height) {
            super(game, x, y, width, height, 'darkgreen', 'red');
            this.type = 'earth';
            this.hp = 3;
        }
    }
    class BlockFactory {
        static createBlock(type, game, x, y, size) {
            switch(type) {
                case 'dirt': return new DirtBlock(game, x, y, size, size);
                case 'earth': return new EarthBlock(game, x, y, size, size);
                default: return new Block(game, x, y, size, size, 'gray', 'red');
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
            this.totalLayers = 100;
            this.generateLayers();
        }
        generateLayers() {
            for (let layerIndex = 0; layerIndex < this.totalLayers; layerIndex++) {
                const yOffset = this.height + layerIndex * this.blockSize - 300;
                for (let i = 0; i < 6; i++) {
                    const x = i * this.blockSize;
                    let type;
        
                    if (layerIndex === 0) type = 'earth';
                    else if (layerIndex === 1) type = 'dirt';
                    else type = Math.random() < 0.5 ? 'dirt' : '';
        
                    const block = BlockFactory.createBlock(type, this, x, yOffset, this.blockSize);
                    this.blocks.push(block);
                }
            }
            console.log(this.blocks);
        }
        
        
        
        update(){
            this.player.update();

            const playerCenterY = this.player.y + this.player.height / 2;
            const screenCenterY = this.height / 2;
            this.cameraY = playerCenterY - screenCenterY;

            if (this.cameraY < 0) this.cameraY = 0;
            const maxCameraY = this.blockSize * this.totalLayers + this.height;
            if (this.cameraY > maxCameraY) this.cameraY = maxCameraY;
        }

        draw(context){
            context.clearRect(0, 0, this.width, this.height);

            context.save();
            context.translate(0, -this.cameraY);

            this.blocks.forEach(block => {
                if (block.y + block.height > this.cameraY && block.y < this.cameraY + this.height) {
                    block.draw(context);
                }
            });

            this.player.draw(context);

            context.restore();
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