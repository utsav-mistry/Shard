import json
from llama_cpp import Llama

# Path to the quantized DeepSeek model
MODEL_PATH = "models/deepseek.gguf"

# Load once globally — adjust threads/gpu layers based on system
llm = Llama(
    model_path="models/deepseek.gguf",
    n_ctx=2048,      
    n_threads=6,     
    n_gpu_layers=10,  
    use_mlock=True,  
    use_mmap=True    
)

def get_code_issues(code):
    prompt = (
        "You are an AI code reviewer. Review the following code and return a list of all possible issues in JSON format. "
        "Skip semicolon errors. Focus on typos, bad practices, incorrect casing, insecure patterns, etc. "
        "DO NOT wrap your answer in code blocks or any markdown. Do NOT include explanations. "
        "Return no erros if not present but don't hallucinate\n"
        "Your response must be ONLY a JSON array like:\n"
        "Identify each and every error precisely thinking that code will go for deployment\n"
        "[\n"
        "  {\"line\": line_number_of_code_here, \"type\": \"type_of_error\", \"advice\": \"'Human readable advice here\"},\n"
        "  {\"line\": line_number_of_code_here, \"type\": \"type_of_error\", \"advice\": \"'Human readable advice here\"}\n"
        "]\n\n"
        f"{code}\n"
        "Count lines **exactly as shown**, starting from 1. No explanation outside JSON.\n\n"
    )



    # try:
    output = llm(prompt=prompt, max_tokens=1024, stop=["\n\n", "</end>"])
    response = output["choices"][0]["text"].strip()
    print(output,"\n",response)

    # Clean model response: extract only valid JSON list
    start = response.find("[")
    end = response.rfind("]") + 1
    json_data = response[start:end]

    return json.loads(json_data)
    
    # except Exception as e:
    #     return [{
    #         "line": 0,
    #         "type": "model_error",
    #         "advice": f"Model failed to respond correctly: {str(e)}"
    #     }]
