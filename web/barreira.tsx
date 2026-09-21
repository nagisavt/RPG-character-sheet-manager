import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * A cerca em volta de uma seção da tela: o que cai lá dentro fica lá dentro.
 *
 * A regra dura do v1 é que **nada aqui pode ser ponto único de falha da
 * Sessão**. Sem esta cerca, uma exceção em qualquer canto derruba a árvore
 * inteira do React e o mestre fica com a tela preta no meio da noite — com os
 * painéis, os botões de vida e a linha de comando junto, que é o que a mesa
 * está esperando. Com ela, some a seção que quebrou e o resto continua de pé.
 *
 * É `class` porque não existe hook para isto: `getDerivedStateFromError` é a
 * única porta que o React abre para capturar exceção de render, e ela é de
 * componente de classe. É a exceção da casa, e mora sozinha neste arquivo.
 */
export class Barreira extends Component<
  { nome: string; children: ReactNode },
  { erro: Error | null }
> {
  state: { erro: Error | null } = { erro: null };

  static getDerivedStateFromError(erro: Error) {
    return { erro };
  }

  componentDidCatch(erro: Error, onde: ErrorInfo) {
    // O console guarda o stack inteiro: é dali que sai o conserto de verdade, e
    // a mensagem na tela é só para o mestre saber o que parou de funcionar.
    console.error(`A seção '${this.props.nome}' caiu:`, erro, onde);
  }

  render() {
    if (this.state.erro === null) return this.props.children;

    return (
      <section className="caiu">
        <p className="resposta recusada">
          A seção <strong>{this.props.nome}</strong> caiu:{" "}
          {this.state.erro.message}
        </p>
        <p className="apagado">
          O resto da tela continua valendo, e nada do que já aconteceu se perdeu
          — o Log está no servidor. Recarregar a página traz a seção de volta.
        </p>
      </section>
    );
  }
}
