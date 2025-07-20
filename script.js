window.addEventListener('load', function(){
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = window.innerHeight - 10;

    class InputHandler {
        constructor(game){
            this.game = game;
            const player = this.game.player;
            this.drawline = false;
            this.targetX = 0;
            this.targetY = 0;
            this.useSlingshot = 1;
            window.addEventListener('mousedown', (e) =>{
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top + this.game.cameraY;
                const isClickOnPlayer = 
                    x >= player.x && x <= player.x + player.width &&
                    y >= player.y && y <= player.y + player.height;
                console.log(x,y)
                if (isClickOnPlayer && this.useSlingshot) {
                    this.clickX = x;
                    this.clickY = y;
                    this.drawline = true;

                    player.speedY = 0;
                    player.speedX = 0;
                    player.gravity = 0;
                    
                    console.log('попал', x, y);
                }
            });
            window.addEventListener('mousemove', (e) => {
                if (this.drawline) {
                    const rect = canvas.getBoundingClientRect();
                    this.mouseX = e.clientX - rect.left;
                    this.mouseY = e.clientY - rect.top + this.game.cameraY;
                }
            });
            window.addEventListener('mouseup', () => {
                if (this.drawline && this.useSlingshot) {
                    this.drawline = false;
                    this.useSlingshot--;

                    const centerX = player.x + player.width / 2;
                    const centerY = player.y + player.height / 2;

                    const dx = centerX  - this.mouseX;
                    const dy = centerY  - this.mouseY;

                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const maxSpeed = 15;
                    const maxDistance = 200;
                    const clampedDistance = Math.min(distance, maxDistance);
                    const strength = clampedDistance / maxDistance;

                    const speedX = (dx / distance) * maxSpeed * strength;
                    const speedY = (dy / distance) * maxSpeed * strength;
                    console.log('дистанция:', distance.toFixed(1), 'сила рогатки:', strength.toFixed(2), 'х скорость:', speedX.toFixed(2), 'у скорость:', speedY.toFixed(2));

                    player.speedX = speedX;
                    player.speedY = speedY;

                    player.gravity = 0.2;
                }
            });
        }
        draw(context) {
            if (this.drawline && this.useSlingshot) {
                const player = this.game.player;
                const centerX = player.x + player.width / 2;
                const centerY = player.y + player.height / 2;
                const dx = this.mouseX - centerX;
                const dy = this.mouseY - centerY;
                const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 200);
                const angle = Math.atan2(dy, dx);
                const endX = centerX - Math.cos(angle) * distance;
                const endY = centerY - Math.sin(angle) * distance;

                context.save();
                context.strokeStyle = 'red';
                context.lineWidth = 3;
                context.lineCap = 'round';
                context.beginPath();
                context.moveTo(centerX, centerY);
                context.lineTo(endX, endY);
                context.stroke();

                const arrowSize = Math.max(8, distance * 0.15);
                context.translate(endX, endY);
                context.rotate(angle + Math.PI);
                
                context.fillStyle = 'red';
                context.beginPath();
                context.moveTo(0, 0);
                context.lineTo(-arrowSize, -arrowSize/2);
                context.lineTo(-arrowSize, arrowSize/2);
                context.closePath();
                context.fill();
                
                context.restore();

                const tension = distance / 200;
                context.fillStyle = `rgba(255, 0, 0, ${0.3 + tension * 0.5})`;
                context.beginPath();
                context.arc(centerX, centerY, 5 + tension * 10, 0, Math.PI * 2);
                context.fill();
            }
        }
    }
    const pickaxeImages = {
        wooden: new Image(),
        stone: new Image(),
        iron: new Image(),
        gold: new Image(),
        diamond: new Image()
    };
    pickaxeImages.wooden.src = 'img/Wooden_pickaxe.webp';
    pickaxeImages.stone.src = 'img/Stone_pickaxe.webp';
    pickaxeImages.iron.src = 'img/Iron_pickaxe.webp';
    pickaxeImages.gold.src = 'img/Gold_pickaxe.webp';
    pickaxeImages.diamond.src = 'img/Diamond_pickaxe.webp';
    class Player {
        constructor(game) {
            this.game = game;
            this.width = 65;
            this.height = 65;
            this.x = 250;
            this.y = 50
            this.speedY = 0;
            this.speedX = 0;
            this.gravity = 0.2;
            this.rotation = 0;
            this.angularVelocity = 0;
            this.angularFriction = 0.5;
            this.pickaxeType = 'wooden';
        }
        update(){
            this.speedX *= 0.99;
            this.speedY += this.gravity;
            
            this.y += this.speedY;
            this.x += this.speedX;
            if (this.x + this.width >= this.game.width || this.x <= 0){
                this.speedX *= -1;
            }
            if (this.y <= 0) this.speedY *= -1;
            this.game.blocks = this.game.blocks.filter(block => {
                if (Player.checkCollision(this, block)) {
                    if (block.type === 'black_hole') return true;
                    const canBreak = this.canBreakBlock(block.type);
                    if (canBreak) block.hp--;

                    const prevX = this.x - this.speedX;
                    const prevY = this.y - this.speedY;

                    const fromLeft = prevX + this.width <= block.x;
                    const fromRight = prevX >= block.x + block.width;
                    const fromTop = prevY + this.height <= block.y;
                    const fromBottom = prevY >= block.y + block.height;
                    if (fromTop) {
                        this.y = block.y - this.height;
                        this.speedY *= -0.8;
                    } else if (fromBottom) {
                        this.y = block.y + block.height;
                        this.speedY *= -0.8;
                    } else if (fromLeft) {
                        this.x = block.x - this.width;
                        this.speedX *= -0.8;
                    } else if (fromRight) {
                        this.x = block.x + block.width;
                        this.speedX *= -0.8;
                    }
                    if (block.type === 'bedrock') {
                        this.game.reachedBedrock = true;
                        this.game.victory();
                    }
                    if (block.hp <= 0 && canBreak) {
                        this.game.updateDestroyedBlock(block.type);
                        return false;
                    }
                    return true;
                }
                return true;
            });
            this.rotation += this.angularVelocity;
            this.angularVelocity *= this.angularFriction;
            
            if (Math.abs(this.speedX) > 0.5 || Math.abs(this.speedY) > 0.5) {
                const rotationDirection = Math.sign(this.speedX) || 1;
                const speedMagnitude = Math.sqrt(this.speedX * this.speedX + this.speedY * this.speedY);
                this.angularVelocity += rotationDirection * speedMagnitude * 0.01;
            }
        }
        draw(context) {
            const image = pickaxeImages[this.pickaxeType];
            if (image && image.complete) {
                context.save();
                const centerX = this.x + this.width / 2;
                const centerY = this.y + this.height / 2;
                context.translate(centerX, centerY);
                context.rotate(this.rotation);
                context.drawImage(
                    image,
                    -this.width / 2 - 10,
                    -this.height / 2 - 10,
                    this.width + 15,
                    this.height + 15
                );
                
                context.restore();
            }
        }
        
        static checkCollision(obj1, obj2) {
            return (
                obj1.x < obj2.x + obj2.width &&
                obj1.x + obj1.width > obj2.x &&
                obj1.y < obj2.y + obj2.height &&
                obj1.y + obj1.height > obj2.y
            )
        }
        canBreakBlock(blockType) {
            switch(this.pickaxeType) {
                case 'wooden':
                    return blockType === 'earth' || blockType === 'dirt';
                case 'stone':
                    return blockType === 'earth' || blockType === 'dirt' || blockType === 'stone' || blockType === 'iron';
                case 'iron':
                    return blockType === 'earth' || blockType === 'dirt' || blockType === 'stone' || blockType === 'iron' || blockType === 'gold';
                case 'gold':
                    return blockType === 'earth' || blockType === 'dirt' || blockType === 'stone' || blockType === 'iron' || blockType === 'gold' || blockType === 'diamond';
                case 'diamond':
                    return blockType !== 'bedrock' && blockType !== 'black_hole';
                default:
                    return false;
            }
        }
    }
    class Block {
        constructor(game, x, y, width, height, image, border = null){
            this.game = game;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.border = border;
            this.image = image;
            this.hp = 1;
        }
        draw(context){
            context.imageSmoothingEnabled = false;
            if (this.image.complete) 
            context.drawImage(this.image, this.x, this.y, this.width, this.height);

            if (this.border) {
                context.strokeStyle = this.border;
                context.strokeRect(this.x, this.y, this.width, this.height);
            }
        }
    }
    const textures = {
        dirt: new Image(),
        earth: new Image(),
        black_hole: new Image(),
        bedrock: new Image(),
        stone: new Image(),
        iron: new Image(),
        gold: new Image(),
        diamond: new Image()
    };

    textures.dirt.src = 'img/Dirt.webp';
    textures.earth.src = 'img/Grass.webp';
    textures.black_hole.src = 'img/black_hole.png';
    textures.bedrock.src = 'img/Bedrock.webp';
    textures.stone.src = 'img/Stone.webp';
    textures.iron.src = 'img/Iron.webp';
    textures.gold.src = 'img/Gold.webp';
    textures.diamond.src = 'img/Diamond.webp';

    class DirtBlock extends Block {
        constructor(game, x, y, width, height) {
            super(game, x, y, width, height, textures.dirt);
            this.type = 'dirt';
            this.hp = 2;
        }
    }
    class EarthBlock extends Block {
        constructor(game, x, y, width, height) {
            super(game, x, y, width, height, textures.earth);
            this.type = 'earth';
            this.hp = 3;
        }
    }
    class BlackHoleBlock extends Block {
        constructor(game, x, y, width, height) {
            super(game, x, y, width, height, textures.black_hole);
            this.type = 'black_hole';
            this.hp = 0;
        }
    }
    class BedrockBlock extends Block {
        constructor(game, x, y, width, height) {
            super(game, x, y, width, height, textures.bedrock);
            this.type = 'bedrock';
            this.hp = Infinity;
        }
    }
    class StoneBlock extends Block {
        constructor(game, x, y, width, height) {
            super(game, x, y, width, height, textures.stone);
            this.type = 'stone';
            this.hp = 4;
        }
    }
    class IronBlock extends Block {
        constructor(game, x, y, width, height) {
            super(game, x, y, width, height, textures.iron); 
            this.type = 'iron';
            this.hp = 6;
        }
    }
    class GoldBlock extends Block {
        constructor(game, x, y, width, height) {
            super(game, x, y, width, height, textures.gold); 
            this.type = 'gold';
            this.hp = 8;
        }
    }
    class DiamondBlock extends Block {
        constructor(game, x, y, width, height) {
            super(game, x, y, width, height, textures.diamond); 
            this.type = 'diamond';
            this.hp = 10;
        }
    }
    
        
    class BlockFactory {
        static createBlock(type, game, x, y, size) {
            switch(type) {
                case 'dirt': return new DirtBlock(game, x, y, size, size);
                case 'earth': return new EarthBlock(game, x, y, size, size);
                case 'black_hole': return new BlackHoleBlock(game, x, y, size, size);
                case 'bedrock': return new BedrockBlock(game, x, y, size, size);
                case 'stone': return new StoneBlock(game, x, y, size, size);
                case 'iron': return new IronBlock(game, x, y, size, size);
                case 'gold': return new GoldBlock(game, x, y, size, size);
                case 'diamond': return new DiamondBlock(game, x, y, size, size);
                default: return new Block(game, x, y, size, size, 'blue', 'red');
            }
        }
    }
    class Background {
        constructor(game) {
            this.game = game;
            this.skyImage = new Image();
            this.skyImage.src = 'img/sky_background.JPG';
            this.caveImage = new Image();
            this.caveImage.src = 'img/cave_background.JPG';
        }

        draw(context) {
            const skyHeight = 628; 
            if (this.skyImage.complete) {
                context.drawImage(this.skyImage, 0, 0, this.game.width, skyHeight);
            }
            const caveStartY = skyHeight - this.game.cameraY;
            if (this.caveImage.complete) {
                for (let y = caveStartY; y < this.game.height; y += this.caveImage.height) {
                    context.drawImage(this.caveImage, 0, y, this.game.width, this.caveImage.height);
                }
            }
        }
    }
    class IU {
        constructor(game){
            this.game = game;
            this.fontSize = 16;
            this.fontFamily = 'Roboto';
            this.color = 'white';
        } 
        draw(context){
            context.fillStyle = this.color;
            const charges = this.game.input.useSlingshot;
            const player = this.game.player;
            const playerX = player.x;
            const playerY = player.y - 35; 
            for (let i = 0; i < charges; i++){
                context.fillRect(playerX + i * ((75 / game.maxUsed) + 5), playerY, ((75 / game.maxUsed) - 5), 3);
            }
            const resources = this.game.state === 'playing' 
            ? this.game.destroyedBlock 
            : this.game.totalResources;
            // const stats = this.game.destroyedBlock;
            // let y = 20;
            // context.font = `${this.fontSize}px ${this.fontFamily}`;
            // context.fillStyle = this.color;
            // context.textAlign = 'left';

            // context.fillText('Resources:', 10, y);
            // y += 25;
            // for (const [type, count] of Object.entries(stats)) {
            //     if (type === 'earth' || type === 'dirt') continue;
            //     const icon = textures[type];
            //     const iconSize = 20;
            //     if (icon && icon.complete) {
            //         context.drawImage(icon, 10, y - iconSize + 5, iconSize, iconSize);
            //     }
            //     context.fillText(`${type}: ${count}`, 35, y + 5);
            //     y += 25;
            // }
        }
    }
    class Game {
        constructor(width, height){
            this.width = width;
            this.height = height;
            this.state = 'menu';
            this.reachedBedrock = false;
            this.inShop = false;
            this.background = new Background(this);
            this.init();
            this.menuButtons = {
                start: { x: width / 2 - 100, y: height / 2, width: 200, height: 50, text: 'Начать игру' },
                shop: { x: width / 2 - 100, y: height / 2 + 70, width: 200, height: 50, text: 'Магазин' }
            };
            this.gameOverButtons = {
                restart: { x: width / 2 - 100, y: height / 2, width: 200, height: 50, text: 'Играть снова' },
                menu: { x: width / 2 - 100, y: height / 2 + 70, width: 200, height: 50, text: 'Главное меню' }
            };
            this.victoryButtons = {
                restart: { x: width / 2 - 100, y: height / 2, width: 200, height: 50, text: 'Играть снова' },
                menu: { x: width / 2 - 100, y: height / 2 + 70, width: 200, height: 50, text: 'Главное меню' }
            };
            this.shopItems = [
                { type: 'stone_pickaxe', price: { stone: 10 }, image: pickaxeImages.stone },
                { type: 'iron_pickaxe', price: { iron: 10 }, image: pickaxeImages.iron },
                { type: 'gold_pickaxe', price: { gold: 10 }, image: pickaxeImages.gold },
                { type: 'diamond_pickaxe', price: { diamond: 10 }, image: pickaxeImages.diamond }
            ];
        }
        init() {
            this.player = new Player(this);
            const savedPickaxe = localStorage.getItem('pickaxeType');
            if (savedPickaxe) {
                this.player.pickaxeType = savedPickaxe;
            }
            this.input = new InputHandler(this);
            this.iu = new IU(this);
            this.blockSize = 100;
            this.blocks = [];
            this.totalLayers = 7;
            this.maxUsed = 3;
            this.usedTimer = 0;
            this.usedInterval = 4000;
            this.destroyedBlock = {};
            this.generateLayers();
            this.reachedBedrock = false;
            this.totalResources = JSON.parse(localStorage.getItem('totalResources')) || {};
            this.destroyedBlock = {};
        }
        generateLayers() {
            for (let layerIndex = 0; layerIndex < this.totalLayers; layerIndex++) {
                const yOffset = this.height + layerIndex * this.blockSize - 300;
                for (let i = 0; i < 6; i++) {
                    const x = i * this.blockSize;
                    let type;
        
                    if (layerIndex === 0) type = 'earth';
                    else if (layerIndex === 1) type = 'dirt';
                    else if (layerIndex === this.totalLayers - 1) type = 'bedrock';
                    else {
                        const rand = Math.random();
                         if (rand < 0.05) {
                            type = 'black_hole'; 
                        } else if (rand < 0.30) {
                            type = 'stone'; 
                        } else if (rand < 0.50) {
                            type = 'iron'; 
                        } else if (rand < 0.65) {
                            type = 'gold'; 
                        } else if (rand < 0.70) {
                            type = 'diamond'; 
                        } else {
                            type = 'stone'; 
                        }
                    } 
                    
                    const block = BlockFactory.createBlock(type, this, x, yOffset, this.blockSize);
                    this.blocks.push(block);
                }
            }
            //console.log(this.blocks);
        }
    
        
        update(deltaTime){
            if (this.state !== 'playing') return;
            for (const block of this.blocks) {
                if (block.type === 'black_hole' && Player.checkCollision(this.player, block)) {
                    this.gameOver();
                    return;
                }
            }
            this.player.update();
            if (this.usedTimer > this.usedInterval && !this.input.drawline) {
                if (this.input.useSlingshot < this.maxUsed) this.input.useSlingshot++;
                this.usedTimer = 0;
            } else {
                this.usedTimer += deltaTime;
            }
            //console.log(this.input.useSlingshot);
            const playerCenterY = this.player.y + this.player.height / 2;
            const screenCenterY = this.height / 2;
            this.cameraY = playerCenterY - screenCenterY;

            if (this.cameraY < 0) this.cameraY = 0;
            const maxCameraY = this.blockSize * this.totalLayers + this.height;
            if (this.cameraY > maxCameraY) this.cameraY = maxCameraY;
        }
        gameOver() {
                this.state = 'gameover';
                this.player.speedX = 0;
                this.player.speedY = 0;
                this.player.gravity = 0;
        }
        victory() {
            console.log("ПОБЕДА! Текущие ресурсы:", this.destroyedBlock);
            this.state = 'victory';
            this.addToTotalResources();
        }
        addToTotalResources() {
            for (const [type, count] of Object.entries(this.destroyedBlock)) {
                if (type === 'earth' || type === 'dirt') continue;
                if (!this.totalResources[type]) {
                    this.totalResources[type] = 0;
                }
                
                this.totalResources[type] += count;
            }
            
            console.log("Ресурсы добавлены:", this.totalResources);
            localStorage.setItem('totalResources', JSON.stringify(this.totalResources));
            
            this.destroyedBlock = {};
        }
        updateDestroyedBlock(type) {
            this.destroyedBlock[type] = (this.destroyedBlock[type] || 0) + 1;
            console.log("Ресурс добавлен:", type, "Текущие:", this.destroyedBlock);
        }
        draw(context){
            context.clearRect(0, 0, this.width, this.height);
            if (this.state === 'shop') {
                this.drawShop(context);
            }
            else if (this.state === 'menu') {
                this.drawMenu(context);
            } 
            else if (this.state === 'gameover') {
                this.drawGameOver(context);
            }
            else if (this.state === 'victory') {
                this.drawVictory(context);
            } else if (this.state === 'playing') {
                this.background.draw(context);
                context.save();
                context.translate(0, -this.cameraY);
                this.blocks.forEach(block => {
                    if (block.y + block.height > this.cameraY && block.y < this.cameraY + this.height) {
                        block.draw(context);
                    }
                });

                this.player.draw(context);
                this.iu.draw(context);
                this.input.draw(context);
                context.restore();
            }
        }
        drawShop(context) {
            context.fillStyle = 'rgba(0, 0, 0, 0.8)';
            context.fillRect(0, 0, this.width, this.height);
            context.fillStyle = 'white';
            context.font = '36px Arial';
            context.textAlign = 'center';
            context.fillText('Магазин', this.width / 2, 50);
            let y = 100;
            const itemHeight = 60;
            const imageSize = 50;
            const buttonWidth = 100;
            
            this.shopItems.forEach((item, index) => {
                context.fillStyle = 'rgba(255, 255, 255, 0.1)';
                context.fillRect(50, y, this.width - 100, itemHeight);
                if (item.image && item.image.complete) {
                    context.drawImage(item.image, 60, y + 5, imageSize, imageSize);
                }
                context.fillStyle = 'white';
                context.font = '20px Arial';
                context.textAlign = 'left';
                const priceText = Object.entries(item.price).map(([res, count]) => `${res}: ${count}`).join(', ');
                context.fillText(`${item.type.replace('_pickaxe', '')} (${priceText})`, 120, y + 35);
                
                context.fillStyle = 'rgba(0, 200, 0, 0.3)';
                context.fillRect(this.width - 160, y + 10, buttonWidth, 40);
                context.strokeStyle = 'white';
                context.strokeRect(this.width - 160, y + 10, buttonWidth, 40);
                
                context.fillStyle = 'white';
                context.font = '18px Arial';
                context.textAlign = 'center';
                context.fillText('Купить', this.width - 110, y + 35);
                
                this.shopItems[index].button = {
                    x: this.width - 160,
                    y: y + 10,
                    width: buttonWidth,
                    height: 40
                };
                
                y += itemHeight + 20;
            });
            
            context.fillStyle = 'rgba(200, 0, 0, 0.3)';
            context.fillRect(this.width / 2 - 100, y + 20, 200, 50);
            context.strokeStyle = 'white';
            context.strokeRect(this.width / 2 - 100, y + 20, 200, 50);
            
            context.fillStyle = 'white';
            context.font = '24px Arial';
            context.textAlign = 'center';
            context.fillText('Вернуться', this.width / 2, y + 50);
            
            this.backButton = {
                x: this.width / 2 - 100,
                y: y + 20,
                width: 200,
                height: 50
            };
        }
        drawMenu(context) {
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, this.width, this.height);
            
            context.fillStyle = 'white';
            context.font = '36px Arial';
            context.textAlign = 'center';
            context.fillText('Главное меню', this.width / 2, this.height / 2 - 100);
            
            this.drawButton(context, this.menuButtons.start);
            this.drawButton(context, this.menuButtons.shop);
            
            this.drawResources(context, this.width / 2 - 100, this.height - 120);
        }
        drawResources(context, x = 10, y = 180) {
            const stats = this.totalResources;
            
            const iconSize = 20;
            const spacing = 80;
            
            let offsetX = 0;
            for (const [type, count] of Object.entries(stats)) {
                if (type === 'earth' || type === 'dirt') continue;
                const icon = textures[type];
                
                if (icon && icon.complete) {
                    context.drawImage(icon, x + offsetX, y, iconSize, iconSize);
                }
                context.fillText(`${count}`, x + offsetX + 25, y + 15);
                offsetX += spacing;
            }
        }
        drawGameOver(context) {
            context.fillStyle = 'rgba(0, 0, 0, 0.7)';
            context.fillRect(0, 0, this.width, this.height);
            
            context.fillStyle = 'white';
            context.font = '36px Arial';
            context.textAlign = 'center';
            context.fillText('Конец игры', this.width / 2, this.height / 2 - 100);
            
            this.drawButton(context, this.gameOverButtons.restart);
            this.drawButton(context, this.gameOverButtons.menu);
        }
        drawButton(context, button) {
            context.fillStyle = 'rgba(255, 255, 255, 0.2)';
            context.fillRect(button.x, button.y, button.width, button.height);
            context.strokeStyle = 'white';
            context.strokeRect(button.x, button.y, button.width, button.height);
            
            context.fillStyle = 'white';
            context.font = '24px Arial';
            context.textAlign = 'center';
            context.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2 + 8);
        }
        drawResources(context) {
            const stats = this.totalResources;
            let y = 150;
            context.font = '20px Arial';
            context.fillStyle = 'white';
            context.textAlign = 'left';
            
            context.fillText('Ресурсы:', this.width / 2 - 100, y);
            y += 30;
            
            for (const [type, count] of Object.entries(stats)) {
                if (type === 'earth' || type === 'dirt') continue;
                const icon = textures[type];
                const iconSize = 20;
                
                if (icon && icon.complete) {
                    context.drawImage(icon, this.width / 2 - 90, y - 15, iconSize, iconSize);
                }
                context.fillText(`${type}: ${count}`, this.width / 2 - 60, y);
                y += 25;
            }
        }
        drawVictory(context) {
            context.fillStyle = 'rgba(0, 100, 0, 0.7)';
            context.fillRect(0, 0, this.width, this.height);
            
            context.fillStyle = 'white';
            context.font = '36px Arial';
            context.textAlign = 'center';
            context.fillText('Победа! Ресурсы сохранены', this.width / 2, this.height / 2 - 100);
            
            this.drawButton(context, this.victoryButtons.restart);
            this.drawButton(context, this.victoryButtons.menu);
        }
    }
    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (game.state === 'menu') {
            if (x >= game.menuButtons.start.x && x <= game.menuButtons.start.x + game.menuButtons.start.width &&
                y >= game.menuButtons.start.y && y <= game.menuButtons.start.y + game.menuButtons.start.height) {
                game.init();
                game.state = 'playing';
            }
            
            if (x >= game.menuButtons.shop.x && x <= game.menuButtons.shop.x + game.menuButtons.shop.width &&
                y >= game.menuButtons.shop.y && y <= game.menuButtons.shop.y + game.menuButtons.shop.height) {
                game.state = 'shop';
            }
        } 
        else if (game.state === 'gameover') {
            if (x >= game.gameOverButtons.restart.x && x <= game.gameOverButtons.restart.x + game.gameOverButtons.restart.width &&
                y >= game.gameOverButtons.restart.y && y <= game.gameOverButtons.restart.y + game.gameOverButtons.restart.height) {
                game.state = 'playing';
                game.init();
            }
            
            if (x >= game.gameOverButtons.menu.x && x <= game.gameOverButtons.menu.x + game.gameOverButtons.menu.width &&
                y >= game.gameOverButtons.menu.y && y <= game.gameOverButtons.menu.y + game.gameOverButtons.menu.height) {
                game.state = 'menu';
                //game.inShop = false;
            }
        }
        else if (game.state === 'victory') {
            if (x >= game.victoryButtons.restart.x && x <= game.victoryButtons.restart.x + game.victoryButtons.restart.width &&
                y >= game.victoryButtons.restart.y && y <= game.victoryButtons.restart.y + game.victoryButtons.restart.height) {
                game.init();
                game.state = 'playing';
            }
            
            if (x >= game.victoryButtons.menu.x && x <= game.victoryButtons.menu.x + game.victoryButtons.menu.width &&
                y >= game.victoryButtons.menu.y && y <= game.victoryButtons.menu.y + game.victoryButtons.menu.height) {
                game.state = 'menu';
            }
        }
        
        if (game.state === 'shop') {
            if (game.backButton && x >= game.backButton.x && x <= game.backButton.x + game.backButton.width &&
                y >= game.backButton.y && y <= game.backButton.y + game.backButton.height) {
                game.state = 'menu';
                return;
            }
            
        game.shopItems.forEach(item => {
            if (item.button && x >= item.button.x && x <= item.button.x + item.button.width &&
                    y >= item.button.y && y <= item.button.y + item.button.height) {
                    
                    let canBuy = true;
                    for (const [res, amount] of Object.entries(item.price)) {
                        if (!game.totalResources[res] || game.totalResources[res] < amount) {
                            canBuy = false;
                            break;
                        }
                    }
                    
                    if (canBuy) {
                        for (const [res, amount] of Object.entries(item.price)) {
                            game.totalResources[res] -= amount;
                        }
                        localStorage.setItem('totalResources', JSON.stringify(game.totalResources));
                        
                        const newPickaxe = item.type.replace('_pickaxe', '');
                        game.player.pickaxeType = newPickaxe;
                        localStorage.setItem('pickaxeType', newPickaxe);
                        console.log(`Куплена кирка: ${item.type}`);
                        
                        game.draw(ctx);
                    } else {
                        console.log(`Недостаточно ресурсов для ${item.type}`);
                        alert("Недостаточно ресурсов!");
                    }
                }
            });
        }
    });

    const game = new Game(canvas.width, canvas.height);
    let lastTime = 0;
    function animate(timeStamp){
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.update(deltaTime);
        game.draw(ctx);
        requestAnimationFrame(animate);
    }
    animate(0);
});