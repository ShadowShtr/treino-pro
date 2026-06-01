export const exerciseGroups = [
  { group: "Peito", exercises: ["Supino reto", "Supino inclinado", "Supino declinado", "Crucifixo", "Crossover", "Peck deck", "Flexão de braço"] },
  { group: "Costas", exercises: ["Puxada alta", "Puxada frente", "Remada baixa", "Remada curvada", "Remada unilateral", "Pulldown", "Barra fixa"] },
  { group: "Pernas", exercises: ["Agachamento livre", "Leg press", "Cadeira extensora", "Mesa flexora", "Cadeira flexora", "Stiff", "Afundo", "Passada", "Hack machine"] },
  { group: "Ombros", exercises: ["Desenvolvimento", "Elevação lateral", "Elevação frontal", "Crucifixo inverso", "Remada alta", "Arnold press"] },
  { group: "Bíceps", exercises: ["Rosca direta", "Rosca alternada", "Rosca martelo", "Rosca Scott", "Rosca concentrada"] },
  { group: "Tríceps", exercises: ["Tríceps pulley", "Tríceps corda", "Tríceps testa", "Tríceps francês", "Paralelas"] },
  { group: "Abdômen", exercises: ["Abdominal supra", "Abdominal infra", "Prancha", "Abdominal oblíquo", "Elevação de pernas"] },
  { group: "Glúteos", exercises: ["Elevação pélvica", "Cadeira abdutora", "Coice na polia", "Agachamento sumô", "Avanço"] },
  { group: "Panturrilha", exercises: ["Panturrilha em pé", "Panturrilha sentado", "Panturrilha no leg press"] },
  { group: "Cardio/condicionamento", exercises: ["Esteira", "Bike ergométrica", "Elíptico", "Escada", "Remo"] }
];

export const baseExercises = exerciseGroups.flatMap((entry) => entry.exercises);
