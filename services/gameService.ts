import { GoogleGenAI } from "@google/genai";
import { GameState, GameLogEntry, Location, Item, Enemy } from '../types.ts';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("La variable de entorno API_KEY no está configurada.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

const worldData = {
  locations: {
    cockpit: {
      id: 'cockpit',
      name: 'Cabina Estrellada',
      baseDescription: 'Estás en la cabina de un transporte militar estrellado. El dosel frontal está destrozado. Los cables chispean débilmente desde una consola. Un desierto polvoriento se extiende ante ti.',
      exits: { 'afuera': 'desierto' },
      items: ['botiquin'],
    },
    desierto: {
      id: 'desierto',
      name: 'Páramo Desértico',
      baseDescription: 'El sol nuclear castiga un paisaje de dunas de arena gris y roca agrietada. El aire es caliente y seco. Los restos de tu vehículo están al sur. A lo lejos, hacia el norte, ves algo que brilla.',
      exits: { 'norte': 'oasis', 'sur': 'cockpit' },
      items: [],
    },
    oasis: {
      id: 'oasis',
      name: 'Oasis Mutado',
      baseDescription: 'Una piscina de agua de aspecto extrañamente claro está rodeada de vegetación de color púrpura. Es un respiro surrealista en el páramo. Hay un esqueleto humano medio enterrado en la arena cerca del agua. Un camino polvoriento se dirige al este.',
      exits: { 'sur': 'desierto', 'este': 'supermercado' },
      items: ['llave_oxidada'],
    },
    supermercado: {
        id: 'supermercado',
        name: 'Supermercado Saqueado',
        baseDescription: 'Los restos de un supermercado "Super-Ahorro". Estanterías volcadas y mercancía podrida ensucian los pasillos. La luz se filtra a través de agujeros en el techo. El olor a descomposición es abrumador.',
        exits: { 'oeste': 'oasis' },
        items: ['tuberia_plomo'],
        enemies: ['mutante_desgarbado'],
    }
  },
  items: {
    botiquin: {
      id: 'botiquin',
      name: 'Botiquín de Primeros Auxilios',
      baseDescription: 'Un botiquín militar de plástico resistente, con una cruz roja descolorida en la tapa.',
      isContainer: true,
      isOpen: false,
      contains: ['venda'],
    },
    venda: {
        id: 'venda',
        name: 'Venda Estéril',
        baseDescription: 'Un paquete sellado al vacío que contiene una venda de grado militar, perfecta para tratar heridas graves.',
        useEffects: {
            heals: 25,
        }
    },
    llave_oxidada: {
      id: 'llave_oxidada',
      name: 'Llave Oxidada',
      baseDescription: 'Una llave de hierro pesada, cubierta de óxido. Parece antigua y fuerte.',
    },
    tuberia_plomo: {
        id: 'tuberia_plomo',
        name: 'Tubería de Plomo',
        baseDescription: 'Un trozo de tubería de plomo, pesada y fría al tacto. Tiene el peso perfecto para romper algo. O a alguien.',
        equipable: true,
        damage: 12,
    }
  },
  enemies: {
    mutante_desgarbado: {
        id: 'mutante_desgarbado',
        name: 'Mutante Desgarbado',
        description: 'Una criatura humanoide alta y delgada, con extremidades demasiado largas y piel pálida y tensa sobre sus huesos. Se mueve con una agilidad espasmódica, y sus ojos sin párpados te observan con una inteligencia hambrienta.',
        health: 40,
        maxHealth: 40,
        attack: 10,
        isAggressive: true,
        drops: [],
        descriptionOnEnter: 'De detrás de una estantería volcada, una figura alta y retorcida se pone en pie. Gruñe, un sonido bajo y gutural, y se lanza hacia ti con garras improvisadas con fragmentos de metal.'
    }
  }
};

const systemInstruction = `Eres el Director de un juego de aventuras de texto post-apocalíptico llamado 'Ecos Nucleares'. El mundo fue devastado por una guerra nuclear que creó mutaciones. Tus descripciones deben ser cinematográficas, directas y viscerales, como si describieras una escena de una película de ciencia ficción post-apocalíptica. Céntrate en la acción y en lo que el jugador ve, oye y siente de forma tangible. Sé conciso pero impactante, en 2-4 frases. Responde siempre en español. Al describir un lugar, menciona las salidas visibles de forma natural en la descripción.`;

const generateText = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error al generar texto con Gemini:", error);
    return "El éter crepita con estática, tu mente no puede formarse un pensamiento claro.";
  }
};

const generateCombatText = async (attacker: string, defender: string, weapon: string | null): Promise<string> => {
    const prompt = `
Eres un narrador cinematográfico para un juego de aventuras. Describe una escena de combate de forma vívida y visceral en una frase concisa.
- Atacante: ${attacker}
- Defensor: ${defender}
- Arma: ${weapon || 'sus puños'}

Instrucciones:
- Céntrate en el impacto y la reacción. No menciones los puntos de vida o el número de daño.
- Responde en español.

Ejemplo (Jugador ataca):
- Prompt: Jugador ataca a Mutante con Tubería de plomo.
- Respuesta: Lanzas un arco brutal con la tubería de plomo, golpeando al mutante en el costado con un crujido húmedo que le hace tambalearse.

Ejemplo (Enemigo ataca):
- Prompt: Mutante ataca a Jugador con garras.
- Respuesta: El mutante se abalanza sobre ti, sus garras afiladas rasgan tu brazo y te arrancan un grito de dolor.

Genera la descripción para la acción actual.`;

    return generateText(prompt);
}


const getDynamicDescription = async (location: Location, items: Item[], enemies: Enemy[]): Promise<string> => {
  const itemNames = items.length > 0 ? items.map(i => i.name).join(', ') : 'nada de interés inmediato';
  const enemyNames = enemies.length > 0 ? enemies.map(e => e.name).join(', ') : 'ninguna amenaza visible';
  const exitNames = Object.keys(location.exits).join(', ');
  const prompt = `Describe cinematográficamente este lugar: ${location.name}. Detalles base: ${location.baseDescription}. Se ve: ${itemNames}. Amenazas: ${enemyNames}. Hay salidas hacia: ${exitNames}.`;
  return generateText(prompt);
};

const getItemDescription = async (item: Item, state: GameState): Promise<string> => {
    let prompt = `El jugador examina un objeto: ${item.name}. Detalles base: ${item.baseDescription}.`;
    if (item.isContainer) {
        if (item.isOpen) {
            const containedItems = item.contains?.map(id => state.world.items[id].name).join(', ') || 'nada';
            prompt += ` Está abierto. Dentro parece que hay: ${containedItems}.`
        } else {
            prompt += " Está cerrado."
        }
    }
  return generateText(prompt);
};

export const initializeGame = async (): Promise<{ state: GameState, message: string }> => {
  const initialState: GameState = {
    currentLocationId: 'cockpit',
    inventory: [],
    log: [],
    world: JSON.parse(JSON.stringify(worldData)),
    isInitialized: true,
    playerHealth: 100,
    maxPlayerHealth: 100,
    currentEnemyId: null,
    equippedWeapon: null,
    isGameOver: false,
  };
  const introPrompt = "Escribe un párrafo de introducción cinematográfico para el juego 'Ecos Nucleares'. El jugador se despierta dentro de la cabina destrozada de un vehículo militar, con el sonido del viento del desierto y sin recordar cómo llegó allí.";
  const introText = await generateText(introPrompt);
  const location = initialState.world.locations[initialState.currentLocationId];
  const itemsInLocation = location.items.map(id => initialState.world.items[id]);
  const enemiesInLocation = (location.enemies || []).map(id => initialState.world.enemies[id]);
  const locationDescription = await getDynamicDescription(location, itemsInLocation, enemiesInLocation);

  return {
    state: initialState,
    message: `${introText}\n\n${locationDescription}`
  };
};

const normalizeText = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, '');
}

async function parseCommandWithAI(command: string, state: GameState): Promise<{action: string; target: string | null;}> {
    const currentLocation = state.world.locations[state.currentLocationId];
    
    const itemsInLocation = currentLocation.items.map(id => state.world.items[id]);
    const itemsInInventory = state.inventory.map(id => state.world.items[id]);
    const allVisibleItems = [...new Set([...itemsInLocation, ...itemsInInventory])];
    const enemiesInLocation = (currentLocation.enemies || []).map(id => state.world.enemies[id].name);

    const prompt = `
Eres un analizador de comandos para un juego de aventuras de texto. Tu función es interpretar el comando del usuario y convertirlo en un objeto JSON estructurado.

Acciones Posibles: "GOTO", "EXAMINE", "TAKE", "USE", "OPEN", "INVENTORY", "HELP", "UNKNOWN", "ATTACK", "EQUIP".

Contexto del Juego:
- Ubicación Actual: "${currentLocation.name}"
- Salidas Disponibles: ${JSON.stringify(currentLocation.exits)}
- Objetos Visibles (en la habitación o en el inventario): ${JSON.stringify(allVisibleItems.map(i => i.name))}
- Enemigos Visibles: ${JSON.stringify(enemiesInLocation)}

Comando del Usuario: "${command}"

Instrucciones:
1. Analiza el comando del usuario en el contexto proporcionado.
2. Determina la acción principal.
3. Identifica el objetivo (target). El objetivo debe coincidir con un objeto, enemigo o salida. Normaliza el objetivo a una palabra clave (ej. "botiquin", "norte", "mutante").
4. Si la acción no es clara, usa "UNKNOWN".
5. Responde **únicamente** con un objeto JSON con "action" y "target".

Ejemplos:
- Comando: "ataca al mutante" -> { "action": "ATTACK", "target": "mutante" }
- Comando: "equípate la tubería" -> { "action": "EQUIP", "target": "tuberia" }
- Comando: "coge la llave" -> { "action": "TAKE", "target": "llave" }

Analiza el comando y devuelve el JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
            config: { responseMimeType: "application/json" },
        });
        
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        
        const parsed = JSON.parse(jsonStr);
        if (parsed.target && typeof parsed.target === 'string') {
            parsed.target = normalizeText(parsed.target).split(' ')[0];
        }
        return parsed;
    } catch (e) {
        console.error("Error parsing command with AI:", e);
        return { action: "UNKNOWN", target: command };
    }
}

export const processCommand = async (command: string, state: GameState): Promise<{ newState: GameState, newLogs: Omit<GameLogEntry, 'id'>[] }> => {
  let newState = { ...state };
  const newLogs: Omit<GameLogEntry, 'id'>[] = [];
  
  if (newState.isGameOver) {
      newLogs.push({ type: 'error', text: "Estás muerto. El páramo reclama tus restos." });
      return { newState, newLogs };
  }

  const parsedAction = await parseCommandWithAI(command, newState);
  const targetName = parsedAction.target;
  let isCombatTurn = false;
  
  const currentLocation = newState.world.locations[newState.currentLocationId];

  switch (parsedAction.action) {
    case 'GOTO': {
      if (newState.currentEnemyId) {
        newLogs.push({ type: 'error', text: "No puedes escapar tan fácilmente mientras luchas." });
        break;
      }
      const exitId = Object.keys(currentLocation.exits).find(exit => exit.includes(targetName || ''));
      if (exitId) {
        newState.currentLocationId = currentLocation.exits[exitId];
        const newLocation = newState.world.locations[newState.currentLocationId];
        const itemsInLocation = newLocation.items.map(id => newState.world.items[id]);
        let enemiesInLocation = (newLocation.enemies || []).map(id => newState.world.enemies[id]);
        
        const description = await getDynamicDescription(newLocation, itemsInLocation, enemiesInLocation);
        newLogs.push({ type: 'system', text: description });

        const aggressiveEnemy = enemiesInLocation.find(e => e.isAggressive && e.health > 0);
        if (aggressiveEnemy) {
          newState.currentEnemyId = aggressiveEnemy.id;
          newLogs.push({ type: 'enemy_turn', text: aggressiveEnemy.descriptionOnEnter });
        }
      } else {
        newLogs.push({ type: 'error', text: `No hay una salida en esa dirección.` });
      }
      break;
    }
    case 'EXAMINE': {
      if (!targetName || targetName === 'alrededor') {
        const itemsInLocation = currentLocation.items.map(id => newState.world.items[id]);
        const enemiesInLocation = (currentLocation.enemies || []).map(id => newState.world.enemies[id]).filter(e => e.health > 0);
        const description = await getDynamicDescription(currentLocation, itemsInLocation, enemiesInLocation);
        newLogs.push({ type: 'system', text: description });
      } else {
        const itemInRoomId = currentLocation.items.find(id => normalizeText(newState.world.items[id].name).includes(targetName));
        const itemInInventoryId = newState.inventory.find(id => normalizeText(newState.world.items[id].name).includes(targetName));
        const itemId = itemInRoomId || itemInInventoryId;
        const enemyId = (currentLocation.enemies || []).find(id => normalizeText(newState.world.enemies[id].name).includes(targetName));
        
        if (itemId) {
            const description = await getItemDescription(newState.world.items[itemId], newState);
            newLogs.push({ type: 'system', text: description });
        } else if (enemyId) {
             const enemy = newState.world.enemies[enemyId];
             newLogs.push({ type: 'system', text: `${enemy.description} Parece hostil.` });
        } else {
            newLogs.push({ type: 'error', text: `No ves ningún "${targetName}" por aquí.` });
        }
      }
      break;
    }
    case 'TAKE': {
        if (newState.currentEnemyId) {
          newLogs.push({ type: 'error', text: "Demasiado arriesgado para saquear ahora mismo." });
          isCombatTurn = true;
          break;
        }
        const itemIndex = currentLocation.items.findIndex(id => normalizeText(newState.world.items[id].name).includes(targetName || ''));
        if (itemIndex > -1) {
            const itemId = currentLocation.items[itemIndex];
            const item = newState.world.items[itemId];
            newState.inventory.push(itemId);
            currentLocation.items.splice(itemIndex, 1);
            newLogs.push({ type: 'info', text: `Tomas el objeto: ${item.name}.` });
        } else {
            newLogs.push({ type: 'error', text: `No puedes tomar eso. O no está aquí.` });
        }
        break;
    }
    case 'OPEN': { /* ... Omitido por brevedad, sin cambios ... */
       if (!targetName) { newLogs.push({ type: 'error', text: '¿Qué quieres abrir?' }); break; }
        let itemId = state.inventory.find(id => normalizeText(state.world.items[id].name).includes(targetName));
        if (!itemId) itemId = currentLocation.items.find(id => normalizeText(state.world.items[id].name).includes(targetName));

        if (itemId) {
            const item = newState.world.items[itemId];
            if (!item.isContainer) {
                newLogs.push({ type: 'error', text: `No puedes abrir eso.` });
            } else if (item.isOpen) {
                newLogs.push({ type: 'info', text: `${item.name} ya está abierto.` });
            } else {
                item.isOpen = true;
                if (item.contains && item.contains.length > 0) {
                    const containedItems = item.contains.map(id => newState.world.items[id].name).join(', ');
                    currentLocation.items.push(...item.contains);
                    item.contains = [];
                    newLogs.push({ type: 'info', text: `Abres ${item.name}. Dentro encuentras: ${containedItems}. Ahora están en el suelo.`});
                } else {
                    newLogs.push({ type: 'info', text: `Abres ${item.name}, pero está vacío.` });
                }
            }
        } else {
            newLogs.push({ type: 'error', text: `No ves ningún "${targetName}" para abrir.` });
        }
        break;
    }
    case 'USE': {
        if (!targetName) { newLogs.push({ type: 'error', text: '¿Qué quieres usar?' }); break; }
        const itemIndex = newState.inventory.findIndex(id => normalizeText(newState.world.items[id].name).includes(targetName));

        if (itemIndex > -1) {
            const itemId = newState.inventory[itemIndex];
            const item = newState.world.items[itemId];
            if (item.useEffects?.heals) {
                newState.playerHealth = Math.min(newState.maxPlayerHealth, newState.playerHealth + item.useEffects.heals);
                newState.inventory.splice(itemIndex, 1); // Consume item
                newLogs.push({ type: 'info', text: `Usas ${item.name}. Sientes cómo tus heridas se cierran un poco. Tu salud ha mejorado.` });
                if (newState.currentEnemyId) isCombatTurn = true;
            } else {
                newLogs.push({ type: 'error', text: `No sabes cómo usar ${item.name} de esa manera.` });
            }
        } else {
            newLogs.push({ type: 'error', text: `No tienes "${targetName}" en tu inventario.` });
        }
        break;
    }
    case 'EQUIP': {
        if (!targetName) { newLogs.push({ type: 'error', text: '¿Qué quieres equipar?' }); break; }
        const itemInInventoryId = newState.inventory.find(id => normalizeText(newState.world.items[id].name).includes(targetName));
        if(itemInInventoryId){
            const item = newState.world.items[itemInInventoryId];
            if(item.equipable){
                newState.equippedWeapon = itemInInventoryId;
                newLogs.push({type: 'info', text: `Equipas: ${item.name}.`});
                if (newState.currentEnemyId) isCombatTurn = true;
            } else {
                newLogs.push({type: 'error', text: `No puedes equipar ${item.name}.`});
            }
        } else {
            newLogs.push({type: 'error', text: `No tienes "${targetName}" en tu inventario.`});
        }
        break;
    }
    case 'ATTACK': {
        if (!newState.currentEnemyId) {
            newLogs.push({ type: 'error', text: "No hay nada que atacar aquí." });
            break;
        }
        const enemy = newState.world.enemies[newState.currentEnemyId];
        const playerBaseDamage = 5;
        const weaponDamage = newState.equippedWeapon ? (newState.world.items[newState.equippedWeapon].damage || 0) : 0;
        const totalDamage = playerBaseDamage + weaponDamage;
        
        enemy.health -= totalDamage;
        isCombatTurn = true;
        
        const weaponName = newState.equippedWeapon ? newState.world.items[newState.equippedWeapon].name : null;
        const combatDesc = await generateCombatText("Jugador", enemy.name, weaponName);
        newLogs.push({ type: 'combat', text: combatDesc });

        if (enemy.health <= 0) {
            newLogs.push({ type: 'info', text: `Has derrotado a ${enemy.name}. El peligro ha pasado, por ahora.` });
            newState.currentEnemyId = null;
            const enemyIndex = currentLocation.enemies?.findIndex(id => id === enemy.id) ?? -1;
            if (enemyIndex > -1) currentLocation.enemies?.splice(enemyIndex, 1);
            // Drop loot
            if(enemy.drops && enemy.drops.length > 0){
                currentLocation.items.push(...enemy.drops);
                const dropNames = enemy.drops.map(id => newState.world.items[id].name).join(', ');
                newLogs.push({ type: 'info', text: `${enemy.name} ha soltado: ${dropNames}.` });
            }
        }
        break;
    }
    case 'INVENTORY': {
        if (newState.inventory.length === 0) {
            newLogs.push({ type: 'system', text: 'No llevas nada encima. Tus bolsillos están vacíos.' });
        } else {
            const itemLines = newState.inventory.map(id => {
                const item = newState.world.items[id];
                let line = `- ${item.name}`;
                if (newState.equippedWeapon === id) line += ' (Equipado)';
                return line;
            });
            const invText = `Llevas lo siguiente:\n${itemLines.join('\n')}`;
            newLogs.push({ type: 'system', text: invText });
        }
        break;
    }
    case 'HELP': {
        newLogs.push({ type: 'system', text: `Comandos de ejemplo: "ir hacia el norte", "examinar el esqueleto", "coger la llave", "abrir el botiquín", "usar la venda", "ver mi inventario", "atacar al mutante", "equipar la tubería".` });
        break;
    }
    default:
      newLogs.push({ type: 'error', text: `El eco de tu pensamiento se pierde en el viento. Intenta expresarlo de otra manera. (Escribe "ayuda" para ver ejemplos).` });
  }

  // Enemy's turn
  if (isCombatTurn && newState.currentEnemyId && newState.world.enemies[newState.currentEnemyId].health > 0) {
      const enemy = newState.world.enemies[newState.currentEnemyId];
      newState.playerHealth -= enemy.attack;

      const enemyAttackDesc = await generateCombatText(enemy.name, "Jugador", "sus garras");
      newLogs.push({ type: 'enemy_turn', text: enemyAttackDesc });

      if (newState.playerHealth <= 0) {
          newState.playerHealth = 0;
          newState.isGameOver = true;
          newLogs.push({ type: 'error', text: "La oscuridad te envuelve. Has sucumbido a tus heridas." });
      }
  }

  return { newState, newLogs };
};