const canvas = document.getElementById('jogoCanvas')
const ctx = canvas.getContext('2d')

// Carregar imagem de game over
const gameOverImg = new Image();
gameOverImg.src = 'gameover.png'; // Substitua pelo caminho da sua imagem

// Verificar se o canvas existe
if (!canvas) {
    console.error('Canvas não encontrado. Verifique se o elemento com id "jogoCanvas" existe no HTML.');
} else {
    // Definir tamanho do canvas se não estiver definido no HTML
    if (!canvas.width) canvas.width = 800;
    if (!canvas.height) canvas.height = 600;
}

const teclasPressionadas = {
   KeyW: false,
   KeyS: false,
   KeyD: false,
   KeyA: false
};
document.addEventListener('keydown', (e) => {
   if (teclasPressionadas.hasOwnProperty(e.code)) {
       teclasPressionadas[e.code] = true;
   }
});
document.addEventListener('keyup', (e) => {
   if (teclasPressionadas.hasOwnProperty(e.code)) {
       teclasPressionadas[e.code] = false;
   }
});

// Sistema de jogo
class JogoController {
    static #pontuacao = 0;
    static #pontuacaoMaxima = localStorage.getItem('pontuacaoMaxima') || 0;
    static #gameOver = false;

    static get pontuacao() {
        return this.#pontuacao;
    }

    static get pontuacaoMaxima() {
        return this.#pontuacaoMaxima;
    }

    static get gameOver() {
        return this.#gameOver;
    }

    static adicionarPonto() {
        this.#pontuacao++;
        if (this.#pontuacao > this.#pontuacaoMaxima) {
            this.#pontuacaoMaxima = this.#pontuacao;
            localStorage.setItem('pontuacaoMaxima', this.#pontuacaoMaxima);
        }
    }

    static encerrarJogo() {
        this.#gameOver = true;
    }

    static reiniciarJogo() {
        this.#pontuacao = 0;
        this.#gameOver = false;
    }

    static desenharPontuacao() {
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.fillText(`Pontuação: ${this.#pontuacao}`, 10, 30);
        ctx.fillText(`Recorde: ${this.#pontuacaoMaxima}`, 10, 60);
    }

    static desenharGameOver() {
        // Desenhar a imagem de game over
        if (gameOverImg.complete) {
            const imgWidth = 600; // Largura desejada para a imagem
            const imgHeight = 200; // Altura desejada para a imagem
            ctx.drawImage(
                gameOverImg, 
                canvas.width/2 - imgWidth/2, 
                canvas.height/2 - imgHeight/2 - 40, 
                imgWidth, 
                imgHeight
            );
        } else {
            // Fallback caso a imagem não tenha carregado
            ctx.font = "40px Arial";
            ctx.fillStyle = "red";
            ctx.textAlign = "center";
            ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 40);
        }
        
        // Texto para reiniciar
        ctx.font = "20px Arial";
        ctx.fillStyle = "white  ";
        ctx.textAlign = "center";
        ctx.fillText("Pressione qualquer tecla para reiniciar", canvas.width/2, canvas.height/2 + 80);
        ctx.textAlign = "left";
    }
}

class Entidade {
   constructor(x, y, largura, altura) {
       this.x = x
       this.y = y
       this.largura = largura
       this.altura = altura
   }
   
   desenhar() {
       ctx.fillStyle = 'black'
       ctx.fillRect(this.x, this.y, this.largura, this.altura)
   }
}


class Cobra extends Entidade {
   #partesCobra = [];
   #tamanho = 1;
   #velocidade = 5  ;
   #direcaoAtual = null;
   #tamanhoParte = 20;

   constructor(x, y, largura, altura) {
       super(x, y, largura, altura);
       // Adiciona a cabeça da cobra
       this.#partesCobra.push({x: this.x, y: this.y});
   }
   
   desenhar() {
       // Desenha cada parte da cobra
       this.#partesCobra.forEach((parte, index) => {
           ctx.fillStyle = index === 0 ? 'darkgreen' : 'green'; // Cabeça mais escura
           ctx.fillRect(parte.x, parte.y, this.#tamanhoParte, this.#tamanhoParte);
       });
   }
   
   atualizar() {
       let direcaoX = 0;
       let direcaoY = 0;
       
       // Determina a direção baseada na tecla pressionada
       if (teclasPressionadas.KeyW && this.#direcaoAtual !== 'baixo') {
           direcaoY = -this.#velocidade;
           this.#direcaoAtual = 'cima';
       } else if (teclasPressionadas.KeyS && this.#direcaoAtual !== 'cima') {
           direcaoY = this.#velocidade;
           this.#direcaoAtual = 'baixo';
       } else if (teclasPressionadas.KeyA && this.#direcaoAtual !== 'direita') {
           direcaoX = -this.#velocidade;
           this.#direcaoAtual = 'esquerda';
       } else if (teclasPressionadas.KeyD && this.#direcaoAtual !== 'esquerda') {
           direcaoX = this.#velocidade;
           this.#direcaoAtual = 'direita';
       } else {
           // Continua na mesma direção se nenhuma tecla nova foi pressionada
           if (this.#direcaoAtual === 'cima') direcaoY = -this.#velocidade;
           else if (this.#direcaoAtual === 'baixo') direcaoY = this.#velocidade;
           else if (this.#direcaoAtual === 'esquerda') direcaoX = -this.#velocidade;
           else if (this.#direcaoAtual === 'direita') direcaoX = this.#velocidade;
       }
       
       // Move a cobra somente se ela estiver se movendo em alguma direção
       if (direcaoX !== 0 || direcaoY !== 0) {
           // Atualiza a posição da cabeça
           const novaCabeca = {
               x: this.#partesCobra[0].x + direcaoX,
               y: this.#partesCobra[0].y + direcaoY
           };
           
           // Insere a nova cabeça no início do array
           this.#partesCobra.unshift(novaCabeca);
           
           // Remove a última parte se a cobra não cresceu
           if (this.#partesCobra.length > this.#tamanho) {
               this.#partesCobra.pop();
           }
           
           // Atualiza a posição principal (usada para detecção de colisões)
           this.x = novaCabeca.x;
           this.y = novaCabeca.y;
           
           // Verifica colisão com as bordas do canvas
           this.#verificarColisaoBorda();
           
           // Verifica colisão com o próprio corpo
           this.#verificarColisaoCorpo();
       }
   }
   
   #verificarColisaoBorda() {
       if (this.x < 0 || this.x + this.largura > canvas.width || 
           this.y < 0 || this.y + this.altura > canvas.height) {
           JogoController.encerrarJogo();
       }
   }
   
   #verificarColisaoCorpo() {
       // Começa do índice 4 para dar espaço para a cobra virar sem colidir com si mesma
       for (let i = 4; i < this.#partesCobra.length; i++) {
           if (this.x === this.#partesCobra[i].x && this.y === this.#partesCobra[i].y) {
               JogoController.encerrarJogo();
               break;
           }
       }
   }
   
   aumentarTamanho() {
       this.#tamanho++;
   }
   
   verificarColisao(comida) {
       if (
           this.x < comida.x + comida.largura &&
           this.x + this.largura > comida.x &&
           this.y < comida.y + comida.altura &&
           this.y + this.altura > comida.y
       ){ 
           this.#houveColisao(comida);
           this.aumentarTamanho();
           JogoController.adicionarPonto();
       }
   }
   
   #houveColisao(comida) {
       comida.reposicionar();
   }
   
   reiniciar() {
       this.x = 100;
       this.y = 200;
       this.#partesCobra = [{x: this.x, y: this.y}];
       this.#tamanho = 1;
       this.#direcaoAtual = null;
   }
}

class Comida extends Entidade {
   constructor() {
       super(0, 0, 20, 20);
       this.reposicionar();
   }
   
   desenhar() {
       ctx.fillStyle = 'red';
       ctx.fillRect(this.x, this.y, this.largura, this.altura);
   }
   
   reposicionar() {
       this.x = Math.floor(Math.random() * (canvas.width - this.largura));
       this.y = Math.floor(Math.random() * (canvas.height - this.altura));
   }
}

const cobra = new Cobra(100, 200, 20, 20);
const comida = new Comida();

// Iniciar o jogo quando qualquer tecla for pressionada após game over
document.addEventListener('keydown', (e) => {
    if (JogoController.gameOver) {
        JogoController.reiniciarJogo();
        cobra.reiniciar();
        comida.reposicionar();
    }
});

function loop() {
   ctx.clearRect(0, 0, canvas.width, canvas.height)
   cobra.desenhar()
   comida.desenhar()
   
   if (!JogoController.gameOver) {
       cobra.atualizar()
       cobra.verificarColisao(comida)
       JogoController.desenharPontuacao()
   } else {
       JogoController.desenharGameOver()
   }
   
   requestAnimationFrame(loop)
}
loop()
