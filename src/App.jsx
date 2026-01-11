import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, Check, Circle, AlertCircle } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

function TaskManagerApp() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loading, setLoading] = useState(false);

  // MODELOS ACTUALIZADOS 2025 - en orden de preferencia
  const AVAILABLE_MODELS = [
    "gemini-2.5-flash",
    "models/gemini-2.5-flash",
    "gemini-2.0-flash-exp",
  ];

  const getAiSuggestion = async (taskText) => {
    setLoading(true);
    
    try {
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!API_KEY) {
        setAiSuggestion('⚠️ API Key no configurada. Agrega VITE_GEMINI_API_KEY en tu archivo .env');
        setLoading(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(API_KEY);
      
      let lastError = null;
      let successModel = null;
      
      // Intentar con cada modelo hasta que uno funcione
      for (const modelName of AVAILABLE_MODELS) {
        try {
          console.log(`🔍 Probando modelo: ${modelName}`);
          
          const model = genAI.getGenerativeModel({ model: modelName });

          const prompt = `Eres un asistente de productividad. Analiza esta tarea: "${taskText}"

Tu trabajo es sugerir exactamente 3 subtareas específicas, concretas y accionables para completar esta tarea de manera efectiva.

IMPORTANTE: Responde ÚNICAMENTE con un array JSON de strings. NO agregues explicaciones, NO uses formato markdown, NO incluyas texto adicional.

Formato esperado:
["Subtarea 1 específica", "Subtarea 2 específica", "Subtarea 3 específica"]

Ejemplo para "Aprender React":
["Completar el tutorial oficial de React en reactjs.org", "Construir una aplicación To-Do simple usando hooks", "Estudiar el ciclo de vida de componentes y manejo de estado"]`;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          successModel = modelName;
          console.log(`✅ Modelo ${modelName} funcionó!`);
          console.log('📝 Respuesta:', text);
          
          // Limpiar la respuesta
          let cleanText = text.trim()
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .replace(/^\s*[\r\n]/gm, '');
          
          // Buscar el array JSON en el texto
          const jsonMatch = cleanText.match(/\[[\s\S]*?\]/);
          if (jsonMatch) {
            cleanText = jsonMatch[0];
          }
          
          // Parsear y validar
          const suggestions = JSON.parse(cleanText);
          
          if (Array.isArray(suggestions) && suggestions.length > 0) {
            setAiSuggestion(suggestions.join('\n• '));
            console.log(`🎉 Éxito con modelo: ${successModel}`);
            setLoading(false);
            return;
          } else {
            throw new Error('La respuesta no contiene un array válido');
          }
          
        } catch (err) {
          console.warn(`❌ Modelo ${modelName} falló:`, err.message);
          lastError = err;
          continue;
        }
      }
      
      // Si ningún modelo funcionó
      throw new Error(
        lastError?.message || 
        'No se pudo conectar con ningún modelo de Gemini. Verifica tu API key en https://aistudio.google.com/app/apikey'
      );
      
    } catch (err) {
      console.error('💥 Error final:', err);
      
      let errorMessage = err.message;
      
      // Mensajes de error más claros
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('401')) {
        errorMessage = 'Tu API key es inválida. Genera una nueva en https://aistudio.google.com/app/apikey';
      } else if (errorMessage.includes('404')) {
        errorMessage = 'Los modelos no están disponibles. Tu API key podría ser antigua. Genera una nueva en https://aistudio.google.com/app/apikey';
      } else if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403')) {
        errorMessage = 'Tu API key no tiene permisos. Verifica que la API de Gemini esté habilitada en tu proyecto de Google Cloud.';
      }
      
      setAiSuggestion(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const addTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        text: newTask,
        completed: false,
        suggestion: aiSuggestion
      };
      setTasks([...tasks, task]);
      setNewTask('');
      setAiSuggestion('');
    }
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">TaskFlow AI</h1>
              <p className="text-sm text-gray-500">Powered by Google Gemini 2.5</p>
            </div>
          </div>
          
          {/* Info sobre API key */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="flex gap-2 items-start">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-blue-800">
                <strong>¿No tienes API key?</strong> Obtén una gratis en{' '}
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-semibold hover:text-blue-600"
                >
                  Google AI Studio
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Nueva Tarea</h2>
          
          <div className="space-y-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && newTask.trim() && addTask()}
              placeholder="Escribe tu tarea... (ej: Aprender React, Organizar una fiesta)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
            />

            <div className="flex gap-3">
              <button
                onClick={() => getAiSuggestion(newTask)}
                disabled={!newTask.trim() || loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                {loading ? 'Generando sugerencias...' : 'Obtener Sugerencias IA'}
              </button>
              
              <button
                onClick={addTask}
                disabled={!newTask.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus size={20} />
                Añadir Tarea
              </button>
            </div>

            {aiSuggestion && (
              <div className={`rounded-xl p-4 ${
                aiSuggestion.includes('❌') 
                  ? 'bg-red-50 border-2 border-red-200'
                  : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200'
              }`}>
                <p className={`text-sm font-semibold mb-2 ${
                  aiSuggestion.includes('❌') ? 'text-red-700' : 'text-purple-700'
                }`}>
                  {aiSuggestion.includes('❌') ? '⚠️ Error:' : '💡 Sugerencias IA:'}
                </p>
                <p className={`text-sm whitespace-pre-line ${
                  aiSuggestion.includes('❌') ? 'text-red-800' : 'text-gray-700'
                }`}>
                  {aiSuggestion.includes('❌') ? aiSuggestion : `• ${aiSuggestion}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Mis Tareas ({tasks.length})
          </h2>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Circle className="text-gray-400" size={40} />
              </div>
              <p className="text-gray-500">No hay tareas aún. ¡Crea una nueva!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`border-2 rounded-xl p-4 transition-all hover:shadow-md ${
                    task.completed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        task.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {task.completed && <Check className="text-white" size={16} />}
                    </button>
                    
                    <div className="flex-1">
                      <p className={`font-medium ${
                        task.completed ? 'text-gray-500 line-through' : 'text-gray-800'
                      }`}>
                        {task.text}
                      </p>
                      
                      {task.suggestion && !task.suggestion.includes('❌') && (
                        <div className="mt-2 text-xs text-purple-600 bg-purple-50 rounded-lg p-2">
                          <span className="font-semibold">💡 Subtareas sugeridas:</span>
                          <p className="mt-1 whitespace-pre-line">• {task.suggestion}</p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="flex-shrink-0 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Arquitectura: Cells • UI: Lit + Polymer • IA: Google Gemini 2.5</p>
        </div>
      </div>
    </div>
  );
}

export default TaskManagerApp;