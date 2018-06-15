-- MySQL dump 10.13  Distrib 5.7.22, for Linux (x86_64)
--
-- Host: localhost    Database: businesses
-- ------------------------------------------------------
-- Server version	5.7.22

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `businesses`
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



LOCK TABLES `Restaurants` WRITE;
INSERT INTO `Restaurants` VALUES (NULL, "Lakeside Grill", "123 The Lake Court", "Corvallis", "OR", "97330", "1231231234", "thelake.com", NULL, "123123", 4.0, 2.5);
INSERT INTO `Restaurants`VALUES (NULL, "Fire and Water", "123 Opposites Drive", "Corvallis", "OR", "97330", "123128", "dichotomy.com", NULL, "17123", 5.0, 3.5);
INSERT INTO `Restaurants`VALUES (NULL, "Grassy Hills", "123 Vegan Drive", "Corvallis", "97330", "OR", "1200734", "ethicalEating.com", NULL, "19341123", 1.0, 4.5);
INSERT INTO `Restaurants`VALUES (NULL, "Porter Steakhouse", "123 Cow Drive", "Corvallis", "97330", "OR", "12312388", "porterSteaks.com", NULL, "55123", 4.0, 5.0);
INSERT INTO `Restaurants`VALUES (NULL, "All Scrambled Up", "123 Breakfast Drive", "Corvallis", "OR", "97330", "8831234", "eatMoreEggs.com", NULL, "1299993", 3.5, 2.0);
UNLOCK TABLES;






--
-- Dumping data for table `businesses`
--
/*
LOCK TABLES `Hotels` WRITE;


UNLOCK TABLES;
*/
--
-- Table structure for table `photos`
--

DROP TABLE IF EXISTS `Activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Activities` (
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
  `rating` float(2,1) DEFAULT NULL, /* these two will be populated by reviews */
  `cost` float(2,1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `photos`
--
/*
LOCK TABLES `photos` WRITE;
UNLOCK TABLES;
*/
--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `Reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Reviews` (
  `id` mediumint(9) NOT NULL AUTO_INCREMENT,
  `cost` float(2,1) NOT NULL,
  `rating` float(2,1) NOT NULL,
  `review` text,
  `userid` char(24) NOT NULL,
  `businessid` mediumint(9) NOT NULL,
  CONSTRAINT PK_Reviews PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

/*LOCK TABLES `reviews` WRITE;
UNLOCK TABLES;*/

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-05-16  6:47:05
