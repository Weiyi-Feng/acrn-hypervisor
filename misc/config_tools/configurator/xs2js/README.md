# XS2JS

Convert XML Schema To JSON Schema.

# Example Code

```python
import os
import json
from xs2js import XS2JS  

schema_file = os.path.join('schema', 'config.xsd')
json_schema = XS2JS(schema_file).get_json_schema()
json_schema = json.dumps(json_schema, indent='\t')
output_file = 'schema.json'
open(output_file, 'w', encoding='utf-8').write(json_schema)
```
