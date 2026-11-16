-- 0003_seed_products: catálogo de partida (162 alimentos). Generado por scripts/build-seed.ts; no editar a mano.
-- Valores aproximados por 100 g/ml basados en USDA FoodData Central (SR Legacy, CC0).

insert into public.seed_products
  (id, name, category, base_unit, energy_kcal, protein_g, carbs_g, sugars_g, fat_g, saturated_fat_g, fiber_g, salt_g, portions, origin)
values
('seed:avena','Copos de avena','Cereales','g',379,13.2,67.7,1,6.5,1.1,10.1,0.01,'[{"name":"puñado","amount":40},{"name":"cucharada","amount":10}]'::jsonb,'usda-sr-legacy'),
('seed:arroz-blanco-crudo','Arroz blanco (crudo)','Cereales','g',360,6.6,79.3,0.1,0.6,0.2,1.3,0.01,'[{"name":"ración","amount":80}]'::jsonb,'usda-sr-legacy'),
('seed:arroz-blanco-cocido','Arroz blanco (cocido)','Cereales','g',130,2.7,28.2,0.1,0.3,0.1,0.4,0,'[{"name":"plato","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:arroz-integral-crudo','Arroz integral (crudo)','Cereales','g',367,7.5,76.2,0.9,2.7,0.5,3.4,0.01,'[{"name":"ración","amount":80}]'::jsonb,'usda-sr-legacy'),
('seed:pasta-cruda','Pasta (cruda)','Cereales','g',371,13,74.7,2.7,1.5,0.3,3.2,0.02,'[{"name":"ración","amount":80}]'::jsonb,'usda-sr-legacy'),
('seed:pasta-cocida','Pasta (cocida)','Cereales','g',158,5.8,30.9,0.6,0.9,0.2,1.8,0,'[{"name":"plato","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:pasta-integral-cruda','Pasta integral (cruda)','Cereales','g',352,14.6,71.6,2.7,1.4,0.3,9.2,0.02,'[{"name":"ración","amount":80}]'::jsonb,'usda-sr-legacy'),
('seed:pan-blanco','Pan blanco','Pan','g',266,8.9,49.4,5.3,3.3,0.7,2.7,1.2,'[{"name":"rebanada","amount":30}]'::jsonb,'usda-sr-legacy'),
('seed:pan-barra','Pan de barra','Pan','g',274,10.8,51.9,2.9,2.3,0.5,2.3,1.5,'[{"name":"trozo","amount":60}]'::jsonb,'usda-sr-legacy'),
('seed:pan-integral','Pan integral','Pan','g',252,12.5,42.7,4.4,3.5,0.7,6,1.2,'[{"name":"rebanada","amount":30}]'::jsonb,'usda-sr-legacy'),
('seed:pan-centeno','Pan de centeno','Pan','g',259,8.5,48.3,3.9,3.3,0.6,5.8,1.5,'[{"name":"rebanada","amount":30}]'::jsonb,'usda-sr-legacy'),
('seed:pan-tostado','Pan tostado (biscote)','Pan','g',407,13.5,72,6,7,1.2,4,1.5,'[{"name":"biscote","amount":8}]'::jsonb,'usda-sr-legacy'),
('seed:tortilla-trigo','Tortilla de trigo','Pan','g',304,8.2,49.4,2.7,8,2.4,3.5,1.1,'[{"name":"tortilla","amount":40}]'::jsonb,'usda-sr-legacy'),
('seed:quinoa-cruda','Quinoa (cruda)','Cereales','g',368,14.1,64.2,0,6.1,0.7,7,0.01,'[{"name":"ración","amount":70}]'::jsonb,'usda-sr-legacy'),
('seed:cuscus-crudo','Cuscús (crudo)','Cereales','g',376,12.8,77.4,0,0.6,0.1,5,0.02,'[{"name":"ración","amount":70}]'::jsonb,'usda-sr-legacy'),
('seed:harina-trigo','Harina de trigo','Cereales','g',364,10.3,76.3,0.3,1,0.2,2.7,0,'[{"name":"cucharada","amount":10}]'::jsonb,'usda-sr-legacy'),
('seed:copos-maiz','Copos de maíz (cereales)','Cereales','g',357,7.5,84,9.5,0.4,0.1,3.3,1.8,'[{"name":"bol","amount":30}]'::jsonb,'usda-sr-legacy'),
('seed:muesli','Muesli','Cereales','g',367,10,66,21,6,1,7.5,0.1,'[{"name":"bol","amount":50}]'::jsonb,'usda-sr-legacy'),
('seed:patata','Patata (cruda)','Tubérculos','g',77,2,17.5,0.8,0.1,0,2.2,0.02,'[{"name":"mediana","amount":170}]'::jsonb,'usda-sr-legacy'),
('seed:patata-cocida','Patata cocida','Tubérculos','g',87,1.9,20.1,0.9,0.1,0,1.8,0.01,'[{"name":"mediana","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:boniato','Boniato (crudo)','Tubérculos','g',86,1.6,20.1,4.2,0.1,0,3,0.14,'[{"name":"mediano","amount":130}]'::jsonb,'usda-sr-legacy'),
('seed:lentejas-crudas','Lentejas (crudas)','Legumbres','g',352,24.6,63.4,2,1.1,0.2,10.7,0.02,'[{"name":"ración","amount":70}]'::jsonb,'usda-sr-legacy'),
('seed:lentejas-cocidas','Lentejas cocidas','Legumbres','g',116,9,20.1,1.8,0.4,0.1,7.9,0.01,'[{"name":"plato","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:garbanzos-crudos','Garbanzos (crudos)','Legumbres','g',378,20.5,63,10.7,6,0.6,12.2,0.06,'[{"name":"ración","amount":70}]'::jsonb,'usda-sr-legacy'),
('seed:garbanzos-cocidos','Garbanzos cocidos','Legumbres','g',164,8.9,27.4,4.8,2.6,0.3,7.6,0.02,'[{"name":"plato","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:alubias-crudas','Alubias blancas (crudas)','Legumbres','g',333,23.4,60.3,2.1,0.9,0.2,15.2,0.04,'[{"name":"ración","amount":70}]'::jsonb,'usda-sr-legacy'),
('seed:alubias-cocidas','Alubias cocidas','Legumbres','g',139,9.7,25.1,0.3,0.4,0.1,6.3,0.01,'[{"name":"plato","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:guisantes','Guisantes','Legumbres','g',81,5.4,14.5,5.7,0.4,0.1,5.1,0.01,'[{"name":"ración","amount":100}]'::jsonb,'usda-sr-legacy'),
('seed:soja-texturizada','Soja texturizada','Legumbres','g',345,50,30,10,1,0.1,18,0.05,'[{"name":"ración","amount":40}]'::jsonb,'usda-sr-legacy'),
('seed:tofu','Tofu firme','Legumbres','g',144,17.3,2.8,0.6,8.7,1.3,2.3,0.04,'[{"name":"ración","amount":100}]'::jsonb,'usda-sr-legacy'),
('seed:hummus','Hummus','Legumbres','g',166,7.9,14.3,0.3,9.6,1.4,6,0.95,'[{"name":"cucharada","amount":15}]'::jsonb,'usda-sr-legacy'),
('seed:pechuga-pollo','Pechuga de pollo','Carne','g',120,22.5,0,0,2.6,0.6,0,0.11,'[{"name":"filete","amount":120}]'::jsonb,'usda-sr-legacy'),
('seed:muslo-pollo','Muslo de pollo (sin piel)','Carne','g',121,19.7,0,0,4.1,1,0,0.24,'[{"name":"muslo","amount":100}]'::jsonb,'usda-sr-legacy'),
('seed:pavo-pechuga','Pechuga de pavo','Carne','g',114,23.7,0,0,1.5,0.4,0,0.13,'[{"name":"filete","amount":120}]'::jsonb,'usda-sr-legacy'),
('seed:ternera-magra','Ternera magra','Carne','g',137,21.5,0,0,5.4,2.2,0,0.15,'[{"name":"filete","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:carne-picada-vacuno','Carne picada de vacuno (15 % grasa)','Carne','g',215,18.6,0,0,15,5.9,0,0.17,'[{"name":"ración","amount":125}]'::jsonb,'usda-sr-legacy'),
('seed:cerdo-lomo','Lomo de cerdo','Carne','g',143,21.4,0,0,5.7,2,0,0.13,'[{"name":"filete","amount":120}]'::jsonb,'usda-sr-legacy'),
('seed:cerdo-costilla','Costilla de cerdo','Carne','g',277,15.5,0,0,23.4,8.2,0,0.21,'[{"name":"ración","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:cordero','Cordero (pierna)','Carne','g',162,20.6,0,0,8.8,3.9,0,0.16,'[{"name":"ración","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:conejo','Conejo','Carne','g',136,20,0,0,5.6,1.7,0,0.12,'[{"name":"ración","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:jamon-serrano','Jamón serrano','Embutidos','g',241,30.5,0.5,0.5,13,4.5,0,4.5,'[{"name":"loncha","amount":15}]'::jsonb,'usda-sr-legacy'),
('seed:jamon-cocido','Jamón cocido','Embutidos','g',107,17,1.5,1,3.5,1.2,0,2.1,'[{"name":"loncha","amount":20}]'::jsonb,'usda-sr-legacy'),
('seed:pavo-fiambre','Fiambre de pavo','Embutidos','g',104,17,3.5,2.5,2,0.6,0,2.2,'[{"name":"loncha","amount":15}]'::jsonb,'usda-sr-legacy'),
('seed:chorizo','Chorizo','Embutidos','g',455,24,2,1,38,14,0,4,'[{"name":"loncha","amount":8}]'::jsonb,'usda-sr-legacy'),
('seed:salchichon','Salchichón','Embutidos','g',438,25,2,1,36.5,13.5,0,4.2,'[{"name":"loncha","amount":8}]'::jsonb,'usda-sr-legacy'),
('seed:salchicha-frankfurt','Salchicha tipo Frankfurt','Embutidos','g',290,11.5,2.5,1.5,26,9.5,0,2.2,'[{"name":"salchicha","amount":50}]'::jsonb,'usda-sr-legacy'),
('seed:bacon','Bacon','Embutidos','g',417,13,1.4,1,40,13.3,0,2.1,'[{"name":"loncha","amount":15}]'::jsonb,'usda-sr-legacy'),
('seed:hamburguesa-vacuno','Hamburguesa de vacuno','Carne','g',230,17,3,0.5,17,7,0,1.3,'[{"name":"unidad","amount":100}]'::jsonb,'usda-sr-legacy'),
('seed:salmon','Salmón','Pescado','g',208,20.4,0,0,13.4,3.1,0,0.15,'[{"name":"lomo","amount":125}]'::jsonb,'usda-sr-legacy'),
('seed:merluza','Merluza','Pescado','g',86,18.3,0,0,1.3,0.3,0,0.25,'[{"name":"filete","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:bacalao','Bacalao fresco','Pescado','g',82,17.8,0,0,0.7,0.1,0,0.14,'[{"name":"filete","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:atun-fresco','Atún fresco','Pescado','g',144,23.3,0,0,4.9,1.3,0,0.1,'[{"name":"filete","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:atun-lata-natural','Atún en lata al natural (escurrido)','Conservas','g',116,25.5,0,0,0.8,0.2,0,0.85,'[{"name":"lata","amount":52}]'::jsonb,'usda-sr-legacy'),
('seed:atun-lata-aceite','Atún en lata en aceite (escurrido)','Conservas','g',198,29.1,0,0,8.2,1.5,0,0.88,'[{"name":"lata","amount":52}]'::jsonb,'usda-sr-legacy'),
('seed:sardina-lata','Sardinas en aceite (escurridas)','Conservas','g',208,24.6,0,0,11.5,1.5,0,0.77,'[{"name":"lata","amount":85}]'::jsonb,'usda-sr-legacy'),
('seed:caballa-lata','Caballa en aceite (escurrida)','Conservas','g',222,22,0,0,15,2.8,0,0.9,'[{"name":"lata","amount":85}]'::jsonb,'usda-sr-legacy'),
('seed:dorada','Dorada','Pescado','g',100,19.8,0,0,2.3,0.6,0,0.18,'[{"name":"ración","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:lubina','Lubina','Pescado','g',97,18.4,0,0,2,0.5,0,0.17,'[{"name":"ración","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:gambas','Gambas','Marisco','g',85,20.1,0,0,0.5,0.1,0,0.3,'[{"name":"ración","amount":100}]'::jsonb,'usda-sr-legacy'),
('seed:mejillones','Mejillones','Marisco','g',86,11.9,3.7,0,2.2,0.4,0,0.72,'[{"name":"ración","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:calamar','Calamar','Marisco','g',92,15.6,3.1,0,1.4,0.4,0,0.11,'[{"name":"ración","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:surimi','Surimi (palitos de cangrejo)','Pescado','g',95,7.6,15,6,0.5,0.1,0.5,1.7,'[{"name":"palito","amount":15}]'::jsonb,'usda-sr-legacy'),
('seed:huevo','Huevo de gallina','Huevos','g',143,12.6,0.7,0.4,9.5,3.1,0,0.36,'[{"name":"huevo M","amount":53},{"name":"huevo L","amount":63}]'::jsonb,'usda-sr-legacy'),
('seed:clara-huevo','Clara de huevo','Huevos','g',52,10.9,0.7,0.7,0.2,0,0,0.42,'[{"name":"clara","amount":33}]'::jsonb,'usda-sr-legacy'),
('seed:leche-entera','Leche entera','Lácteos','ml',61,3.2,4.8,4.8,3.3,1.9,0,0.11,'[{"name":"vaso","amount":250},{"name":"taza","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:leche-semidesnatada','Leche semidesnatada','Lácteos','ml',46,3.3,4.8,4.8,1.6,1,0,0.11,'[{"name":"vaso","amount":250},{"name":"taza","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:leche-desnatada','Leche desnatada','Lácteos','ml',34,3.4,5,5,0.1,0.1,0,0.11,'[{"name":"vaso","amount":250},{"name":"taza","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:bebida-soja','Bebida de soja','Lácteos','ml',43,3,3,2.5,1.8,0.3,0.5,0.1,'[{"name":"vaso","amount":250}]'::jsonb,'usda-sr-legacy'),
('seed:bebida-avena','Bebida de avena','Lácteos','ml',46,1,7,4,1.5,0.2,0.8,0.1,'[{"name":"vaso","amount":250}]'::jsonb,'usda-sr-legacy'),
('seed:yogur-natural','Yogur natural','Lácteos','g',61,3.5,4.7,4.7,3.3,2.1,0,0.12,'[{"name":"yogur","amount":125}]'::jsonb,'usda-sr-legacy'),
('seed:yogur-desnatado','Yogur natural desnatado','Lácteos','g',56,5.7,7.7,7.7,0.2,0.1,0,0.18,'[{"name":"yogur","amount":125}]'::jsonb,'usda-sr-legacy'),
('seed:yogur-griego','Yogur griego','Lácteos','g',133,5.7,4,4,10.2,6.8,0,0.12,'[{"name":"yogur","amount":125}]'::jsonb,'usda-sr-legacy'),
('seed:skyr','Skyr natural','Lácteos','g',63,11,4,4,0.2,0.1,0,0.1,'[{"name":"tarrina","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:queso-fresco-batido','Queso fresco batido 0 %','Lácteos','g',46,8,3.5,3.5,0.2,0.1,0,0.1,'[{"name":"cucharada","amount":30}]'::jsonb,'usda-sr-legacy'),
('seed:queso-fresco','Queso fresco (tipo Burgos)','Quesos','g',174,12.4,3,3,12.5,8,0,0.75,'[{"name":"ración","amount":60}]'::jsonb,'usda-sr-legacy'),
('seed:requeson','Requesón','Quesos','g',98,11.1,3.4,2.7,4.3,1.7,0,0.9,'[{"name":"ración","amount":100}]'::jsonb,'usda-sr-legacy'),
('seed:queso-curado','Queso curado','Quesos','g',410,28,0.5,0.5,33,21,0,1.8,'[{"name":"loncha","amount":20}]'::jsonb,'usda-sr-legacy'),
('seed:queso-semicurado','Queso semicurado','Quesos','g',375,25,0.5,0.5,30,19,0,1.6,'[{"name":"loncha","amount":20}]'::jsonb,'usda-sr-legacy'),
('seed:queso-mozzarella','Mozzarella','Quesos','g',280,22,2.2,1,20,12.5,0,1.6,'[{"name":"bola","amount":125}]'::jsonb,'usda-sr-legacy'),
('seed:queso-rallado','Queso rallado','Quesos','g',392,28,0,0,31,20,0,1.6,'[{"name":"cucharada","amount":10}]'::jsonb,'usda-sr-legacy'),
('seed:queso-lonchas','Queso en lonchas (tipo sándwich)','Quesos','g',310,19,4,3,25,16,0,2.5,'[{"name":"loncha","amount":20}]'::jsonb,'usda-sr-legacy'),
('seed:nata-cocinar','Nata para cocinar','Lácteos','ml',195,2.5,3.5,3.5,18,11.5,0,0.1,'[{"name":"cucharada","amount":15}]'::jsonb,'usda-sr-legacy'),
('seed:mantequilla','Mantequilla','Grasas','g',717,0.9,0.1,0.1,81.1,51.4,0,0.03,'[{"name":"cucharadita","amount":5}]'::jsonb,'usda-sr-legacy'),
('seed:aceite-oliva','Aceite de oliva','Grasas','ml',820,0,0,0,91,13,0,0,'[{"name":"cucharada","amount":10},{"name":"cucharadita","amount":4}]'::jsonb,'usda-sr-legacy'),
('seed:aceite-girasol','Aceite de girasol','Grasas','ml',820,0,0,0,91,9.5,0,0,'[{"name":"cucharada","amount":10}]'::jsonb,'usda-sr-legacy'),
('seed:aguacate','Aguacate','Frutas','g',160,2,8.5,0.7,14.7,2.1,6.7,0.02,'[{"name":"medio","amount":70}]'::jsonb,'usda-sr-legacy'),
('seed:aceitunas','Aceitunas verdes','Grasas','g',145,1,3.8,0.5,15.3,2,3.3,3.9,'[{"name":"unidad","amount":4}]'::jsonb,'usda-sr-legacy'),
('seed:almendras','Almendras','Frutos secos','g',579,21.2,21.6,4.4,49.9,3.8,12.5,0,'[{"name":"puñado","amount":25}]'::jsonb,'usda-sr-legacy'),
('seed:nueces','Nueces','Frutos secos','g',654,15.2,13.7,2.6,65.2,6.1,6.7,0.01,'[{"name":"puñado","amount":25}]'::jsonb,'usda-sr-legacy'),
('seed:cacahuetes','Cacahuetes','Frutos secos','g',567,25.8,16.1,4.7,49.2,6.3,8.5,0.05,'[{"name":"puñado","amount":25}]'::jsonb,'usda-sr-legacy'),
('seed:crema-cacahuete','Crema de cacahuete','Frutos secos','g',588,25.1,20,9.2,50.4,10.3,6,1.1,'[{"name":"cucharada","amount":16}]'::jsonb,'usda-sr-legacy'),
('seed:anacardos','Anacardos','Frutos secos','g',553,18.2,30.2,5.9,43.9,7.8,3.3,0.03,'[{"name":"puñado","amount":25}]'::jsonb,'usda-sr-legacy'),
('seed:pistachos','Pistachos (sin cáscara)','Frutos secos','g',560,20.2,27.2,7.7,45.3,5.9,10.6,0.01,'[{"name":"puñado","amount":25}]'::jsonb,'usda-sr-legacy'),
('seed:avellanas','Avellanas','Frutos secos','g',628,15,16.7,4.3,60.8,4.5,9.7,0,'[{"name":"puñado","amount":25}]'::jsonb,'usda-sr-legacy'),
('seed:semillas-chia','Semillas de chía','Semillas','g',486,16.5,42.1,0,30.7,3.3,34.4,0.04,'[{"name":"cucharada","amount":12}]'::jsonb,'usda-sr-legacy'),
('seed:semillas-lino','Semillas de lino','Semillas','g',534,18.3,28.9,1.6,42.2,3.7,27.3,0.08,'[{"name":"cucharada","amount":10}]'::jsonb,'usda-sr-legacy'),
('seed:pipas-girasol','Pipas de girasol peladas','Semillas','g',584,20.8,20,2.6,51.5,4.5,8.6,0.02,'[{"name":"puñado","amount":25}]'::jsonb,'usda-sr-legacy'),
('seed:tomate','Tomate','Verduras','g',18,0.9,3.9,2.6,0.2,0,1.2,0.01,'[{"name":"mediano","amount":120}]'::jsonb,'usda-sr-legacy'),
('seed:lechuga','Lechuga','Verduras','g',15,1.4,2.9,0.8,0.2,0,1.3,0.07,'[{"name":"ración","amount":80}]'::jsonb,'usda-sr-legacy'),
('seed:espinacas','Espinacas','Verduras','g',23,2.9,3.6,0.4,0.4,0.1,2.2,0.2,'[{"name":"ración","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:brocoli','Brócoli','Verduras','g',34,2.8,6.6,1.7,0.4,0,2.6,0.08,'[{"name":"ración","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:coliflor','Coliflor','Verduras','g',25,1.9,5,1.9,0.3,0.1,2,0.08,'[{"name":"ración","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:zanahoria','Zanahoria','Verduras','g',41,0.9,9.6,4.7,0.2,0,2.8,0.17,'[{"name":"mediana","amount":70}]'::jsonb,'usda-sr-legacy'),
('seed:cebolla','Cebolla','Verduras','g',40,1.1,9.3,4.2,0.1,0,1.7,0.01,'[{"name":"mediana","amount":110}]'::jsonb,'usda-sr-legacy'),
('seed:ajo','Ajo','Verduras','g',149,6.4,33.1,1,0.5,0.1,2.1,0.04,'[{"name":"diente","amount":4}]'::jsonb,'usda-sr-legacy'),
('seed:pimiento-rojo','Pimiento rojo','Verduras','g',31,1,6,4.2,0.3,0,2.1,0.01,'[{"name":"unidad","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:pimiento-verde','Pimiento verde','Verduras','g',20,0.9,4.6,2.4,0.2,0.1,1.7,0.01,'[{"name":"unidad","amount":120}]'::jsonb,'usda-sr-legacy'),
('seed:calabacin','Calabacín','Verduras','g',17,1.2,3.1,2.5,0.3,0.1,1,0.02,'[{"name":"unidad","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:berenjena','Berenjena','Verduras','g',25,1,5.9,3.5,0.2,0,3,0.01,'[{"name":"unidad","amount":250}]'::jsonb,'usda-sr-legacy'),
('seed:pepino','Pepino','Verduras','g',15,0.7,3.6,1.7,0.1,0,0.5,0.01,'[{"name":"unidad","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:champinones','Champiñones','Verduras','g',22,3.1,3.3,2,0.3,0.1,1,0.01,'[{"name":"ración","amount":100}]'::jsonb,'usda-sr-legacy'),
('seed:judias-verdes','Judías verdes','Verduras','g',31,1.8,7,3.3,0.2,0,2.7,0.02,'[{"name":"ración","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:alcachofa','Alcachofa','Verduras','g',47,3.3,10.5,1,0.2,0,5.4,0.24,'[{"name":"unidad","amount":120}]'::jsonb,'usda-sr-legacy'),
('seed:esparragos','Espárragos verdes','Verduras','g',20,2.2,3.9,1.9,0.1,0,2.1,0.01,'[{"name":"ración","amount":120}]'::jsonb,'usda-sr-legacy'),
('seed:puerro','Puerro','Verduras','g',61,1.5,14.2,3.9,0.3,0,1.8,0.05,'[{"name":"unidad","amount":90}]'::jsonb,'usda-sr-legacy'),
('seed:calabaza','Calabaza','Verduras','g',26,1,6.5,2.8,0.1,0.1,0.5,0,'[{"name":"ración","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:col','Col / repollo','Verduras','g',25,1.3,5.8,3.2,0.1,0,2.5,0.05,'[{"name":"ración","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:maiz-dulce','Maíz dulce (lata, escurrido)','Verduras','g',81,2.6,15.5,4.5,1.2,0.2,2.6,0.5,'[{"name":"lata","amount":140}]'::jsonb,'usda-sr-legacy'),
('seed:tomate-triturado','Tomate triturado (lata)','Conservas','g',32,1.6,7.3,4.4,0.3,0,1.9,0.3,'[{"name":"ración","amount":100}]'::jsonb,'usda-sr-legacy'),
('seed:tomate-frito','Tomate frito','Salsas','g',78,1.5,10,7,3.5,0.5,1.5,1.2,'[{"name":"cucharada","amount":20}]'::jsonb,'usda-sr-legacy'),
('seed:gazpacho','Gazpacho','Platos','ml',45,0.8,4,3,2.8,0.4,0.8,0.6,'[{"name":"vaso","amount":250}]'::jsonb,'usda-sr-legacy'),
('seed:platano','Plátano','Frutas','g',89,1.1,22.8,12.2,0.3,0.1,2.6,0,'[{"name":"mediano","amount":120}]'::jsonb,'usda-sr-legacy'),
('seed:manzana','Manzana','Frutas','g',52,0.3,13.8,10.4,0.2,0,2.4,0,'[{"name":"mediana","amount":180}]'::jsonb,'usda-sr-legacy'),
('seed:naranja','Naranja','Frutas','g',47,0.9,11.8,9.4,0.1,0,2.4,0,'[{"name":"mediana","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:mandarina','Mandarina','Frutas','g',53,0.8,13.3,10.6,0.3,0,1.8,0,'[{"name":"unidad","amount":80}]'::jsonb,'usda-sr-legacy'),
('seed:pera','Pera','Frutas','g',57,0.4,15.2,9.8,0.1,0,3.1,0,'[{"name":"mediana","amount":170}]'::jsonb,'usda-sr-legacy'),
('seed:fresas','Fresas','Frutas','g',32,0.7,7.7,4.9,0.3,0,2,0,'[{"name":"ración","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:uvas','Uvas','Frutas','g',69,0.7,18.1,15.5,0.2,0.1,0.9,0,'[{"name":"racimo","amount":120}]'::jsonb,'usda-sr-legacy'),
('seed:kiwi','Kiwi','Frutas','g',61,1.1,14.7,9,0.5,0,3,0,'[{"name":"unidad","amount":75}]'::jsonb,'usda-sr-legacy'),
('seed:melon','Melón','Frutas','g',34,0.8,8.2,7.9,0.2,0,0.9,0.04,'[{"name":"tajada","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:sandia','Sandía','Frutas','g',30,0.6,7.6,6.2,0.2,0,0.4,0,'[{"name":"tajada","amount":250}]'::jsonb,'usda-sr-legacy'),
('seed:pina','Piña','Frutas','g',50,0.5,13.1,9.9,0.1,0,1.4,0,'[{"name":"rodaja","amount":80}]'::jsonb,'usda-sr-legacy'),
('seed:melocoton','Melocotón','Frutas','g',39,0.9,9.5,8.4,0.3,0,1.5,0,'[{"name":"unidad","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:arandanos','Arándanos','Frutas','g',57,0.7,14.5,10,0.3,0,2.4,0,'[{"name":"puñado","amount":50}]'::jsonb,'usda-sr-legacy'),
('seed:mango','Mango','Frutas','g',60,0.8,15,13.7,0.4,0.1,1.6,0,'[{"name":"unidad","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:datiles','Dátiles','Frutas','g',282,2.5,75,63.4,0.4,0,8,0,'[{"name":"unidad","amount":8}]'::jsonb,'usda-sr-legacy'),
('seed:pasas','Pasas','Frutas','g',299,3.1,79.2,59.2,0.5,0.1,3.7,0.03,'[{"name":"puñado","amount":30}]'::jsonb,'usda-sr-legacy'),
('seed:zumo-naranja','Zumo de naranja','Bebidas','ml',45,0.7,10.4,8.4,0.2,0,0.2,0,'[{"name":"vaso","amount":200}]'::jsonb,'usda-sr-legacy'),
('seed:azucar','Azúcar','Dulces','g',387,0,100,100,0,0,0,0,'[{"name":"cucharadita","amount":5},{"name":"sobre","amount":8}]'::jsonb,'usda-sr-legacy'),
('seed:miel','Miel','Dulces','g',304,0.3,82.4,82.1,0,0,0.2,0.01,'[{"name":"cucharada","amount":21}]'::jsonb,'usda-sr-legacy'),
('seed:mermelada','Mermelada','Dulces','g',250,0.4,62,50,0.1,0,1,0.08,'[{"name":"cucharada","amount":20}]'::jsonb,'usda-sr-legacy'),
('seed:chocolate-negro','Chocolate negro 70 %','Dulces','g',598,7.8,45.9,24,42.6,24.5,10.9,0.05,'[{"name":"onza","amount":10}]'::jsonb,'usda-sr-legacy'),
('seed:chocolate-leche','Chocolate con leche','Dulces','g',535,7.7,59.4,51.5,29.7,18.5,3.4,0.2,'[{"name":"onza","amount":10}]'::jsonb,'usda-sr-legacy'),
('seed:cacao-polvo','Cacao en polvo azucarado','Dulces','g',380,5,80,75,3,1.8,6,0.2,'[{"name":"cucharada","amount":15}]'::jsonb,'usda-sr-legacy'),
('seed:galletas-maria','Galletas tipo María','Dulces','g',436,7,74,22,12,5,2.5,0.6,'[{"name":"galleta","amount":6}]'::jsonb,'usda-sr-legacy'),
('seed:magdalena','Magdalena','Dulces','g',430,6,52,28,22,5,1,0.6,'[{"name":"unidad","amount":30}]'::jsonb,'usda-sr-legacy'),
('seed:croissant','Cruasán','Dulces','g',406,8.2,45.8,11.3,21,11.7,2.6,0.8,'[{"name":"unidad","amount":60}]'::jsonb,'usda-sr-legacy'),
('seed:helado','Helado de vainilla','Dulces','g',207,3.5,23.6,21.2,11,6.8,0.7,0.2,'[{"name":"bola","amount":60}]'::jsonb,'usda-sr-legacy'),
('seed:patatas-fritas-bolsa','Patatas fritas de bolsa','Aperitivos','g',536,7,53,0.3,34.6,3.1,4.4,1.3,'[{"name":"bolsa pequeña","amount":40}]'::jsonb,'usda-sr-legacy'),
('seed:palomitas','Palomitas','Aperitivos','g',387,12.9,77.8,0.9,4.5,0.6,14.5,0.02,'[{"name":"bol","amount":30}]'::jsonb,'usda-sr-legacy'),
('seed:mayonesa','Mayonesa','Salsas','g',680,1,0.6,0.6,75,11.7,0,1.6,'[{"name":"cucharada","amount":15}]'::jsonb,'usda-sr-legacy'),
('seed:ketchup','Kétchup','Salsas','g',101,1,27.4,22.8,0.1,0,0.3,2.3,'[{"name":"cucharada","amount":17}]'::jsonb,'usda-sr-legacy'),
('seed:mostaza','Mostaza','Salsas','g',60,3.7,5.8,0.9,3.3,0.2,4,2.8,'[{"name":"cucharadita","amount":5}]'::jsonb,'usda-sr-legacy'),
('seed:salsa-soja','Salsa de soja','Salsas','ml',53,8.1,4.9,0.4,0.6,0.1,0.8,14.5,'[{"name":"cucharada","amount":15}]'::jsonb,'usda-sr-legacy'),
('seed:vinagre','Vinagre','Salsas','ml',18,0,0.04,0.04,0,0,0,0,'[{"name":"cucharada","amount":15}]'::jsonb,'usda-sr-legacy'),
('seed:sal','Sal','Condimentos','g',0,0,0,0,0,0,0,99,'[{"name":"pizca","amount":1}]'::jsonb,'usda-sr-legacy'),
('seed:cafe-solo','Café solo','Bebidas','ml',1,0.1,0,0,0,0,0,0,'[{"name":"taza","amount":60}]'::jsonb,'usda-sr-legacy'),
('seed:refresco-cola','Refresco de cola','Bebidas','ml',42,0,10.6,10.6,0,0,0,0.01,'[{"name":"lata","amount":330}]'::jsonb,'usda-sr-legacy'),
('seed:refresco-cola-zero','Refresco de cola sin azúcar','Bebidas','ml',0.3,0,0,0,0,0,0,0.02,'[{"name":"lata","amount":330}]'::jsonb,'usda-sr-legacy'),
('seed:cerveza','Cerveza','Bebidas','ml',43,0.5,3.6,0,0,0,0,0.01,'[{"name":"caña","amount":200},{"name":"tercio","amount":330}]'::jsonb,'usda-sr-legacy'),
('seed:vino-tinto','Vino tinto','Bebidas','ml',85,0.1,2.6,0.6,0,0,0,0.01,'[{"name":"copa","amount":150}]'::jsonb,'usda-sr-legacy'),
('seed:proteina-whey','Proteína whey en polvo','Suplementos','g',380,78,8,5,5,3,0,0.5,'[{"name":"cacito","amount":30}]'::jsonb,'usda-sr-legacy')
on conflict (id) do update set
  name = excluded.name, category = excluded.category, base_unit = excluded.base_unit,
  energy_kcal = excluded.energy_kcal, protein_g = excluded.protein_g, carbs_g = excluded.carbs_g,
  sugars_g = excluded.sugars_g, fat_g = excluded.fat_g, saturated_fat_g = excluded.saturated_fat_g,
  fiber_g = excluded.fiber_g, salt_g = excluded.salt_g, portions = excluded.portions, origin = excluded.origin;

-- Copia el seed a un usuario (idempotente: solo los que aún no tiene).
create or replace function public.copy_seed_to(p_user uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with ins as (
    insert into products (user_id,name,category,base_unit,energy_kcal,protein_g,carbs_g,sugars_g,
                          fat_g,saturated_fat_g,fiber_g,salt_g,source,source_id)
    select p_user,s.name,s.category,s.base_unit,s.energy_kcal,s.protein_g,s.carbs_g,s.sugars_g,
           s.fat_g,s.saturated_fat_g,s.fiber_g,s.salt_g,'seed',s.id
    from seed_products s
    where not exists (select 1 from products p where p.user_id = p_user and p.source = 'seed' and p.source_id = s.id)
    returning id, source_id
  )
  insert into portions (user_id, product_id, name, amount)
  select p_user, ins.id, p->>'name', (p->>'amount')::numeric
  from ins join seed_products s on s.id = ins.source_id
  cross join lateral jsonb_array_elements(s.portions) p;
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.copy_seed_to(uuid) from public, anon, authenticated;

-- El alta usa la misma función.
create or replace function public.bootstrap_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into meal_slots (user_id, name, position, start_time) values
    (new.id,'Desayuno',1,'00:00'),(new.id,'Comida',2,'11:00'),
    (new.id,'Merienda',3,'16:00'),(new.id,'Cena',4,'19:30'),(new.id,'Snacks',5,null);
  perform public.copy_seed_to(new.id);
  return new;
end $$;

-- Usuarios ya existentes.
select public.copy_seed_to(id) from auth.users;
