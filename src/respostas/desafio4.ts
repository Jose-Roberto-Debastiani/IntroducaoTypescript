// Um desenvolvedor tentou criar um projeto que consome a base de dados de filme do TMDB para criar um organizador de filmes, mas desistiu 
// pois considerou o seu código inviável. Você consegue usar typescript para organizar esse código e a partir daí aprimorar o que foi feito?

// A ideia dessa atividade é criar um aplicativo que: 
//    - Busca filmes
//    - Apresenta uma lista com os resultados pesquisados
//    - Permite a criação de listas de filmes e a posterior adição de filmes nela

// Todas as requisições necessárias para as atividades acima já estão prontas, mas a implementação delas ficou pela metade (não vou dar tudo de graça).
// Atenção para o listener do botão login-button que devolve o sessionID do usuário
// É necessário fazer um cadastro no https://www.themoviedb.org/ e seguir a documentação do site para entender como gera uma API key https://developers.themoviedb.org/3/getting-started/introduction

let apiKey : string;
let requestToken : string;
let username : string;
let password : string;
let sessionId : string;
let listId : any;

let loginButton = document.getElementById('login-button')!;
let searchButton = document.getElementById('search-button')!;
let searchContainer = document.getElementById('search-container')!;

let createListButton = document.getElementById('create-list-button')!;
let searchListButton = document.getElementById('search-list-button')!;
let listContainer = document.getElementById('list-container')!;

let addFilmButton = document.getElementById('add-film-button')!;

loginButton.addEventListener('click', async () => {
  await criarRequestToken();
  await logar();
  await criarSessao();
  console.log("Login com sucesso!");
})

searchButton.addEventListener('click', async () => {
  let lista = document.getElementById("lista");
  if (lista) {
    lista.outerHTML = "";
  }
  let query = (document.getElementById('search')! as HTMLInputElement).value;
  let listaDeFilmes = await procurarFilme(query);
  let ul = document.createElement('ul');
  ul.id = "lista"
  for (const item of listaDeFilmes.results) {
    let li = document.createElement('li');
    li.appendChild(document.createTextNode("(" + item.id + ") - " + item.original_title))
    ul.appendChild(li)
  }
  console.log(listaDeFilmes);
  searchContainer.appendChild(ul);
})

createListButton.addEventListener('click', async () => {
    let name = (document.getElementById('name-list')! as HTMLInputElement).value;
    let descr = (document.getElementById('descr-list')! as HTMLInputElement).value;
    if (name && descr) {
      let result = await criarLista(name, descr);
    }
})  

searchListButton.addEventListener('click', async () => {
    let lista = document.getElementById("lista-custom");
    if (lista) {
      lista.outerHTML = "";
    }
    listId = (document.getElementById('search-list')! as HTMLInputElement).value;

    pegarLista();
})

addFilmButton.addEventListener('click', async () => {
    let filmId = (document.getElementById('film-id')! as HTMLInputElement).value;

    await adicionarFilmeNaLista(filmId, listId);
    await pegarLista();
})

  
function preencherSenha() {
  password = (document.getElementById('senha')! as HTMLInputElement).value;
  validateLoginButton();
}

function preencherLogin() {
  username =  (document.getElementById('login')! as HTMLInputElement).value;
  validateLoginButton();
}

function preencherApi() {
  apiKey = (document.getElementById('api-key')! as HTMLInputElement).value;
  validateLoginButton();
}

function validateLoginButton() {
  if (password && username && apiKey) {
    (loginButton as HTMLButtonElement).disabled = false;
  } else {
    (loginButton as HTMLButtonElement).disabled = true;
  }
}

interface getParams {
    url: string;
    method: string;
    body: any;
}

class HttpClient {
  static async get(p: getParams) {
    return new Promise<any>((resolve, reject) => {
      let request = new XMLHttpRequest();
      request.open(p.method, p.url, true);

      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          resolve(JSON.parse(request.responseText));
        } else {
          reject({
            status: request.status,
            statusText: request.statusText
          })
        }
      }
      request.onerror = () => {
        reject({
          status: request.status,
          statusText: request.statusText
        })
      }

      let sendBody: any;
      if (p.body) {
        request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        sendBody = JSON.stringify(p.body);
      } else {
        sendBody = null;
      }
      request.send(sendBody);
    })
  }
}

async function procurarFilme(query: string) {
  query = encodeURI(query)
  console.log(query)
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`,
    method: "GET",
    body : null
  })
  return result
}

async function adicionarFilme(filmeId : string) {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${apiKey}&language=en-US`,
    method: "GET",
    body: null

  })
  console.log(result);
}

async function criarRequestToken () {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/authentication/token/new?api_key=${apiKey}`,
    method: "GET",
    body: null
  })
  requestToken = result.request_token
}

async function logar() {
  await HttpClient.get({
    url: `https://api.themoviedb.org/3/authentication/token/validate_with_login?api_key=${apiKey}`,
    method: "POST",
    body: {
      username: `${username}`,
      password: `${password}`,
      request_token: `${requestToken}`
    }
  })
}

async function criarSessao() {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/authentication/session/new?api_key=${apiKey}&request_token=${requestToken}`,
    method: "GET",
    body: null
  })
  sessionId = result.session_id;
}

async function criarLista(nomeDaLista: string, descricao: string) {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/list?api_key=${apiKey}&session_id=${sessionId}`,
    method: "POST",
    body: {
      name: nomeDaLista,
      description: descricao,
      language: "pt-br"
    }
  })
  console.log("criarLista");
  console.log(result);
  if (result && result.status_code == 1) {
    listId = result.list_id;
    (document.getElementById('search-list')! as HTMLInputElement).value = listId;
  } else {
    (document.getElementById('search-list')! as HTMLInputElement).value = "";
    listId = undefined;
  }

}

async function adicionarFilmeNaLista(filmeId: string, listaId: string) {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/list/${listaId}/add_item?api_key=${apiKey}&session_id=${sessionId}`,
    method: "POST",
    body: {
      media_id: filmeId
    }
  })
  console.log("adicionarFilmeNaLista");
  console.log(result);
}

async function pegarLista() {
  let result = await HttpClient.get({
    url: `https://api.themoviedb.org/3/list/${listId}?api_key=${apiKey}`,
    method: "GET",
    body: null
  })
  console.log("pegarLista");
  console.log(result);
  if (result) {
    (document.getElementById('name-list')! as HTMLInputElement).value = result.name;
    (document.getElementById('descr-list')! as HTMLInputElement).value = result.description;


    let lista = document.getElementById("lista-filmes");
    if (lista) {
        lista.outerHTML = "";
    }
    let ul = document.createElement('ul');
    ul.id = "lista-filmes"
    for (const item of result.items) {
        let li = document.createElement('li');
        li.appendChild(document.createTextNode("(" + item.id + ") - " + item.original_title))
        ul.appendChild(li)
    }
    listContainer.appendChild(ul);
  }
}