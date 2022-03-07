import os
import json

from pprint import pprint
from collections import OrderedDict
from functools import lru_cache as cache

import xmltodict


class XSTypes:
    def __init__(self, schema_dict):
        self.simple = self.load_type(schema_dict.get('xs:simpleType', []))
        self.complex = self.load_type(schema_dict.get('xs:complexType', []))

    @staticmethod
    def load_type(type_list):
        return {type_info['@name']: type_info for type_info in type_list}

    def get_type(self, type_name):
        if type_name in self.simple:
            return self.simple[type_name]
        elif type_name in self.complex:
            return self.complex[type_name]
        print(type_name)
        raise NotImplementedError


class XS:
    def __init__(self, schema_filename):
        self.schema = self.load_file(schema_filename)
        self.types = XSTypes(self.schema)

    @staticmethod
    def load_file(schema_filename):
        """load xml schema file and convert it to json dict"""
        schema = open(schema_filename, encoding='utf-8').read()

        # load schema_content
        schema_content = xmltodict.parse(schema)
        schema_content = schema_content['xs:schema']

        # handle xinclude element
        XS._handle_include(schema_filename, schema_content)

        return schema_content

    @staticmethod
    def _handle_include(schema_filename, schema_content):
        """parse xsd document xi:include tag and inject their content to origin document content"""
        if 'xi:include' in schema_content:
            for include in reversed(schema_content['xi:include']):
                source_path = os.path.join(os.path.dirname(schema_filename), include['@href'])
                include_content = XS.load_file(source_path)

                # marge data
                for attr in ['xs:simpleType', 'xs:complexType']:
                    if attr in include_content:
                        if attr not in schema_content:
                            schema_content[attr] = []

                        schema_content[attr] = [
                            *include_content[attr],
                            *schema_content[attr]
                        ]


class XS2JS:
    xst2jst_mapping = {
        'xs:string': 'string',
        'xs:integer': 'integer'
    }
    xsa2jsa_mapping = {
        'xs:minLength': ('minLength', int),
        'xs:maxLength': ('maxLength', int),
        'xs:pattern': ('pattern', lambda x: f"^{x}$"),
        'xs:minInclusive': ('minimum', int),
        'xs:maxInclusive': ('maximum', int),
    }

    def __init__(self, schema_filename):
        self.xs = XS(schema_filename)

    def _get_definitions(self):
        """convert xml schema types to json schema definitions"""
        definitions = OrderedDict()

        # simple types
        for type_name, simple_type in self.xs.types.simple.items():
            definitions[type_name] = self.xso2jso(simple_type)

        # complex types
        for type_name, complex_type in self.xs.types.complex.items():
            definitions[type_name] = self.xse2jse(complex_type)

        return definitions

    def get_json_schema(self):
        json_schema = self.xse2jse(self.xs.schema)
        json_schema["additionalProperties"] = True
        json_schema['$schema'] = "http://json-schema.org/draft-07/schema"
        json_schema.move_to_end('$schema', False)
        json_schema["definitions"] = self._get_definitions()
        return json_schema

    def xst2jst(self, type_name) -> str:
        """convert xml schema type name to json schema type name"""
        if type_name in self.xst2jst_mapping:
            return self.xst2jst_mapping[type_name]
        print(type_name)
        raise NotImplementedError

    def xsa2jsa(self, restriction):
        """convert xml schema object attrs to json schema object attrs"""
        result = {}
        for key in restriction:
            if key in self.xsa2jsa_mapping:
                js_key, js_type = self.xsa2jsa_mapping[key]
                result[js_key] = js_type(restriction[key]['@value'])
        return result

    def xso2jso(self, obj, show_type_name=False) -> OrderedDict:
        """convert xml schema object to json schema object"""
        if 'xs:restriction' in obj:
            restriction = obj['xs:restriction']
            js_st = OrderedDict({"type": self.xst2jst(restriction['@base'])})
            if show_type_name:
                js_st['title'] = obj['@name']
                js_st.move_to_end('title', False)
            if 'xs:enumeration' in restriction:
                type_func = {"string": str, "integer": int}.get(js_st['type'], str)
                js_st["enum"] = [type_func(x['@value']) for x in restriction['xs:enumeration']]
            js_st.update(self.xsa2jsa(restriction))
            return js_st
        elif 'xs:union' in obj:
            member_types = obj['xs:union']['@memberTypes'].split(' ')
            member_js_objects = []
            for type_name in member_types:
                member_type = self.xs.types.get_type(type_name)
                member_js_objects.append(self.xso2jso(member_type, True))
            # Todo: union type refactor
            return OrderedDict({"anyOf": member_js_objects})
        print(obj)
        raise NotImplementedError

    def get_element_define(self, element):
        basic_define = {}
        if 'xs:simpleType' in element:
            basic_define = self.xso2jso(element['xs:simpleType'])
        elif '@type' in element:
            element_type = element['@type']
            if element_type in self.xst2jst_mapping:
                basic_define['type'] = self.xst2jst_mapping[element_type]
            else:
                basic_define["$ref"] = "#/definitions/%s" % element_type
        elif 'xs:complexType' in element:
            basic_define = self.xse2jse(element['xs:complexType'])
        else:
            print(json.dumps(element, indent=2))
            raise NotImplementedError
        return basic_define

    def xse2jse(self, obj) -> OrderedDict:
        """convert xml schema elements to json schema elements"""
        properties = OrderedDict()
        required = []

        # get elements
        all_elements = self.get_elements(obj)

        for element in all_elements:
            name = element['@name']

            # get element basic define (basic/simple type? $ref?)
            try:
                basic_define = self.get_element_define(element)
            except NotImplementedError:
                print(f"{name} not translated")
                continue

            # build element json schema
            js_ele = OrderedDict(basic_define)

            # get default
            if '@default' in element:
                default = element['@default']
                if default.isdigit():
                    default = int(default)

                js_ele['default'] = default

            # is this element is required ?
            if '@minOccurs' in element:
                min_items = int(element['@minOccurs'])
                if min_items > 0:
                    required.append(name)
                if min_items > 1:
                    js_ele['minItems'] = min_items
            else:
                # by default, field is required
                required.append(name)

            if '@maxOccurs' in element:
                if 'type' in js_ele:
                    js_ele['items'] = {'type': js_ele['type']}
                elif '$ref' in js_ele:
                    js_ele['items'] = {'$ref': js_ele['$ref']}
                    del js_ele['$ref']
                else:
                    raise NotImplementedError

                if element['@maxOccurs'] == "unbounded":
                    # unlimited, only set type = array
                    js_ele['type'] = 'array'
                else:
                    js_ele['type'] = 'array'
                    js_ele['maxItems'] = int(element['@maxOccurs'])

                if 'default' in js_ele:
                    js_ele['items']['default'] = js_ele['default']
                    del js_ele['default']

            # get description
            if 'xs:annotation' in element:
                js_ele['title'] = element['xs:annotation'].get('@acrn:title', name)
                js_ele['description'] = (lambda x: x if x else '')(element['xs:annotation']['xs:documentation'])

            properties[name] = js_ele

        # build result
        result = OrderedDict({"type": "object"})

        if required:
            result['required'] = required

        if properties:
            result["properties"] = properties

        return result

    @staticmethod
    def get_elements(obj):
        """get elements from xml schema object"""
        all_elements = []
        if 'xs:element' in obj:
            elements = obj['xs:element']
            if not isinstance(elements, list):
                elements = [elements]
            all_elements.extend(elements)
        for attr in ['xs:sequence', 'xs:all']:
            if attr in obj:
                elements = obj[attr]['xs:element']
                if not isinstance(elements, list):
                    elements = [elements]
                all_elements.extend(elements)
        return all_elements


def main():
    repo_root = os.path.dirname(os.path.abspath(os.path.dirname(__file__)))

    schema_file = os.path.join(repo_root, 'schema', 'sliced.xsd')
    json_schema = XS2JS(schema_file).get_json_schema()
    json_schema = json.dumps(json_schema, indent='\t')
    output_file = os.path.join(repo_root, 'src', 'assets', 'schema', 'scenario.json')
    open(output_file, 'w', encoding='utf-8').write(json_schema)
    print("File %s Convert Success. JSON Schema Write To: %s" % (repr(schema_file), repr(output_file)))


if __name__ == '__main__':
    main()
