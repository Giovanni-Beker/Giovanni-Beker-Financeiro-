const DataAPI = 'https://gsqorbummwauzdfqicdp.supabase.co';
const Apikey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcW9yYnVtbXdhdXpkZnFpY2RwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MzA2MzcsImV4cCI6MjA3ODAwNjYzN30.ECOQjNW6ueu1bsJq6_5UlRrxra3KHehMSZ2kpnCJzgE';

const supabase = window.supabase.createClient(DataAPI, Apikey)

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("transactionForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const valor = document.getElementById("valor").value;
        const type = document.getElementById("type").value;
        const category = document.getElementById("category").value;
        const description = document.getElementById("description").value;

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert("Você precisa estar logado!");
            return;
        }

        const value = await fetchValues();

        if (type === 'saida' && valor > value.saldo) {
            alert("Você não pode retirar mais do que o saldo disponível!!");
            return;
        }

        const { data, error } = await supabase
            .from("transactions")
            .insert([{ user_id: user.id, amount: valor, type: type, category: category, description: description, }]);

        if (error) {
            console.error("Erro ao enviar:", error);
            alert("Erro ao registrar transação!");
        } else {
            alert("Transação registrada com sucesso!");
            form.reset();
        }
    });
});

async function carregarResumo() {
    if (!document.getElementById("totalEntradas")) {
        return;
    }

    const value = await fetchValues();

    document.getElementById("totalEntradas").textContent = formatarMoeda(value.entrada);
    document.getElementById("totalSaidas").textContent = formatarMoeda(value.saida);
    document.getElementById("saldoFinal").textContent = formatarMoeda(value.saldo);
}

async function fetchValues() {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
        console.error("Erro ao obter usuário:", userError);
        return;
    }
    const user = userData?.user;
    if (!user) {
        console.warn("Usuário não autenticado.");
        return;
    }

    const { data, error } = await supabase
        .from("transactions").select("*").eq("user_id", user.id);

    if (error) {
        console.error("Erro ao carregar resumo: ", error);
        return;
    }

    let totalEntrada = 0;
    let totalSaida = 0;

    data.forEach(item => {
        const valor = parseFloat(item.amount);
        if (item.type === "entrada") {
            totalEntrada += valor;
        } else if (item.type === "saida") {
            totalSaida += valor;
        }
    });

    const saldo = totalEntrada - totalSaida;

    return {
        saldo: saldo,
        saida: totalSaida,
        entrada: totalEntrada
    }
}

function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

async function carregarTransacoes(periodo, categoria) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;
    let filters = supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id);

    if (categoria && categoria !== "") {
        filters = filters.eq('category', categoria);
    }

    let dataInicial = null;

    if (periodo === 'mes') {
        dataInicial = new Date();
        dataInicial.setDate(1);
        dataInicial.setHours(0, 0, 0, 0);
    }

    if (dataInicial) {
        filters = filters.gte('created_at', dataInicial.toISOString().split('T')[0]);
    }

    const { data, error } = await filters.order('created_at', { ascending: false });
    const lista = document.getElementById("listaTransacoes");
    lista.innerHTML = "";

    if (error) {
        console.error(error);
        return;
    }

    if (!data || data.length === 0) {
        lista.innerHTML = `
          <li class="sem-transacoes" style = "text-align:center; padding:15px; color:#777;">
                Nenhuma transação feita no momento.
          </li > `;
        return;
    }

    data.forEach(item => {
        const li = document.createElement("li");
        li.classList.add("trans-item", item.type);
        li.id = item.id;
        li.innerHTML = `
            <span class="categoria">${item.category}</span>
            <span class="valor">${item.type === "entrada" ? '+' : '-'} ${formatarMoeda(parseFloat(item.amount))}</span>
            <span class="data">${new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
        `;
        lista.appendChild(li);
    });
}

async function carregarNomeUsuario() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error("Erro ao obter usuário:", error);
        return;
    } if (user) {
        const nome = user.user_metadata?.name || "Usuário";
        document.getElementById("usuarioNome").textContent = `Olá, ${nome}👋`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    carregarNomeUsuario();
    carregarResumo();
    carregarTransacoes(
        document.getElementById("filtroPeriodo").value,
        document.getElementById("filtroCategoria").value
    );

    const filtroPeriodo = document.getElementById("filtroPeriodo");
    const filtroCategoria = document.getElementById("filtroCategoria");

    const Filters = () => {
        carregarTransacoes(filtroPeriodo.value, filtroCategoria.value);
    };

    filtroPeriodo.addEventListener('change', Filters);
    filtroCategoria.addEventListener('change', Filters);
});
function sair() {
    window.location.href = "login.html";
}

function resumo() {
    window.location.href = "resumo.html";

}
function financeiro() {
    window.location.href = "financeiro.html";
}

