try:
    import transformers
    print('Transformers imported successfully')
except Exception as e:
    print(f'Error importing transformers: {e}')

try:
    from transformers import CLIPProcessor, CLIPModel
    print('CLIP models imported successfully')
except Exception as e:
    print(f'Error importing CLIP: {e}')