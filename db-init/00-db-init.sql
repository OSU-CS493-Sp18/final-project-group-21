--
-- Table structure for table `Hotels`
--
DROP TABLE IF EXISTS `Hotels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Hotels` (
  `id` mediumint(9) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `state` char(2) NOT NULL,
  `zip` char(5) NOT NULL,
  `phone` char(12) NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ownerid` char(24) NOT NULL,
  `rating` float(2,1) DEFAULT NULL, /*These two values will be populated by reviews */
  `cost` float(2,1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ownerid` (`ownerid`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `Hotels` WRITE;

INSERT INTO `Hotels` VALUES (NULL, "Marriot", "1234 Cherry Street", "Corvallis", "OR", "95762", "1231231234", "fake.com", "fake@fake.global", "123123123123", 4.0, 3.5);
INSERT INTO `Hotels` VALUES (NULL, "Zeus' Beard", "1234 Olympic Court", "Corvallis", "OR", "97330", "1231899234", "fake.com", "fake@fake.com", "12301223123", 3.0, 4.5);
INSERT INTO `Hotels` VALUES (NULL, "Odin's Raven", "1234 Valhalla Drive", "Corvallis", "OR", "97330", "1276834", "fake.com", "notReal@fake.global", "1231238623123", 3.0, 1.5);
INSERT INTO `Hotels` VALUES (NULL, "Beds, Beds, Beds", "1234 Repitition Street", "Corvallis", "OR", "97330", "129154234", "fake.com", "fake@fake.global", "00123123", 5.0, 2.5);
INSERT INTO `Hotels` VALUES (NULL, "WaterFall Beds", "1234 Dry Street", "Corvallis", "OR", "97330", "12300134", "fake.com", "fake@fake.global", "18912123", 2.0, 4.5);

UNLOCK TABLES;
DROP TABLE IF EXISTS `Restaurants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Restaurants` (
  `id` mediumint(9) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `state` char(2) NOT NULL,
  `zip` char(5) NOT NULL,
  `phone` char(12) NOT NULL,
  `website` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `ownerid` char(24) NOT NULL,
  `rating` float(2,1) DEFAULT NULL, /*These two values will be populated by reviews */
  `cost` float(2,1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ownerid` (`ownerid`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=latin1;

--
-- Table structure for table `reviews`
--
DROP TABLE IF EXISTS `Reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Reviews` (
  `type` char(2) NOT NULL,
  `id` mediumint(9) NOT NULL AUTO_INCREMENT,
  `cost` float(2,1) NOT NULL,
  `rating` float(2,1) NOT NULL,
  `review` text,
  `userid` char(24) NOT NULL,
  `businessid` mediumint(9) NOT NULL,
  CONSTRAINT PK_Reviews PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
