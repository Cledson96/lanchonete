const fallbackWhatsAppUrl =
  "https://wa.me/5511999990000?text=Oi%2C+quero+pedir+na+Lanchonete%20Familia";

export const brandContent = {
  name: "Lanchonete Familia",
  shortName: "Familia",
  whatsappUrl: process.env.NEXT_PUBLIC_WHATSAPP_URL || fallbackWhatsAppUrl,
  location: "Rua da Familia, 128 - Centro, Sao Paulo",
  hours: "Seg a Dom, das 18h as 23h30",
  eyebrow: "Cardapio vivo, pedido facil",
  headline: "Abra o cardapio da noite e escolha o que sai da chapa primeiro.",
  subheadline:
    "Burgers artesanais, sucos gelados e adicionais da casa em uma pagina pensada para escolher rapido, pedir bonito e matar a fome sem friccao.",
  supportPoints: [
    "Pedido online sem enrolacao",
    "Delivery, retirada e comanda local",
    "WhatsApp conectado ao preparo do pedido",
  ],
  stats: [
    { label: "Entrega media", value: "20-40 min" },
    { label: "Pedido no WhatsApp", value: "Ativo" },
    { label: "Atendimento", value: "Todos os dias" },
  ],
  serviceLine: ["Delivery", "Retirada", "Comanda local"],
  menuTitle: "O menu vem primeiro.",
  menuBody:
    "A primeira leitura da home precisa te colocar diante dos sabores, dos precos e das categorias. A marca aparece no clima, no ritmo e no acabamento.",
  storyTitle: "Feita para mesa cheia, conversa longa e fome boa.",
  storyBody:
    "A Lanchonete Familia junta a praticidade do pedido online com o cuidado de uma casa que conhece seu bairro. O cardapio vai do burger caprichado aos sucos e adicionais que deixam cada pedido do seu jeito.",
  storyList: [
    "Ingredientes com cara de cozinha viva, nao de linha de montagem.",
    "Fluxo unico entre site, WhatsApp e operacao interna.",
    "Experiencia pensada para delivery, retirada e consumo no local.",
  ],
  finalTitle: "Escolha o seu combo da noite e a gente cuida do resto.",
  finalBody:
    "Abra o cardapio, monte o pedido e acompanhe tudo com a mesma atencao da cozinha ao balcao.",
};
