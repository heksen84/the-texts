<?php
include_once ("class.mail.php");

class User
{	
	private static $user = null;	
	
	/* --- получить пользователя --- */
	public static function getUser() {	
		if (self::$user == null){			
			self::$user = new User();						
			return self::$user;
		}
	}
						
	/* --- регистрация --- */
	function register()
	{			
		$db	= DataBase::getDB();		
		$vk_id  = $_POST['vk_id'];

		/* -- регистрация через vk -- */
		if (!empty($vk_id)) 
		{
			if (!isset($vk_id)) msg::error("нет данных");
			
			$type 	  = (int)$_POST['type'];
			$login 	  = (string)$_POST['login'];		
			$email    = (string)$_POST['email'];
			
			// --- безопасность
			$login 		= $db->safe_string($login);		
			$login 		= trim($login);				
			$email		= $db->safe_string($email);		
			$email 		= trim($email);
			
			if (empty($login) || empty($email)) msg::warning("поля должны быть заполнены");
			
			$table = $db->select("SELECT * FROM `users` WHERE email='".$email."'");		
			if ($table!=false) msg::warning("пользователь уже существует");
			
			$user_id = $db->query("INSERT INTO `users` VALUES (NULL,'".$type."','".$login."','".$email."','','".$vk_id."','0','0',NOW(),NOW())");
		
			$_SESSION["user_id"] 	= $user_id;
			$_SESSION["user_email"] = $email;
			
			$mail = new Mail("no-reply@my-literature.com");
			$mail->setFromName("Моя литература");
			$content = "<center><h1>Добро пожаловать в портал МОЯ ЛИТЕРАТУРА!</h1><a href=https://".$_SERVER['HTTP_HOST'].">перейти на сайт</a></center>";
			$mail->send($email, "Моя литература", $content);		
			msg::success($login);
		}
		else
		{		
			/* -- стандартная регистрация -- */
			if (!isset($_POST['type']) || !isset($_POST['login']) || !isset($_POST['email']) || !isset($_POST['password'])) msg::error("нет данных");
				
			$type 	  = (int)$_POST['type'];
			$login 	  = (string)$_POST['login'];		
			$email    = (string)$_POST['email'];
			$password = (string)$_POST['password'];
					
			// --- безопасность
			$login 		= $db->safe_string($login);		
			$login 		= trim($login);				
			$email		= $db->safe_string($email);		
			$email 		= trim($email);
		
			$password	= $db->safe_string($password);					
			$password 	= trim($password);
		
			if (empty($login) || empty($email) || empty($password)) msg::warning("поля должны быть заполнены");
				
			$table = $db->select("SELECT * FROM `users` WHERE email='".$email."'");		
			if ($table!=false) msg::warning("пользователь уже существует");
				
			if (strlen($password) < 5) msg::error("плохой пароль");
			$hash_password = password_hash($password, PASSWORD_BCRYPT); 	
		
			$vk_id = 0; 
			$ok_id = 0; 
			$fb_id = 0;		
		
			$user_id = $db->query("INSERT INTO `users` VALUES (NULL,'".$type."','".$login."','".$email."','".$hash_password."','".$vk_id."','".$ok_id."','".$fb_id."',NOW(),NOW())");
		
			$_SESSION["user_id"] 	= $user_id;
			$_SESSION["user_email"] = $email;

			$mail = new Mail("no-reply@my-literature.com");
			$mail->setFromName("Моя литература");
			$content = "<center><h1>Добро пожаловать в портал МОЯ ЛИТЕРАТУРА!</h1><h2>Ваш пароль: ".$password."</h2><a href=https://".$_SERVER['HTTP_HOST'].">перейти на сайт</a></center>";
			$mail->send($email, "Данные регистрации", $content);		
			msg::success($login);
		}
	}
 
	/* --- авторизация --- */
	function auth()
	{						
		$db = DataBase::getDB();				
		if (!isset($_GET['email']) || !isset($_GET['password'])) msg::error("нет данных");					

		$email	  = (string)$_GET['email'];        
		$password = (string)$_GET['password'];		
		
		if (empty($email) || empty($password)) msg::warning("введите данные");										
			
		$email 		= $db->safe_string($email);
		$email 	  	= trim($email);				
		$password 	= $db->safe_string($password);
		$password 	= trim($password);				
					
		$result = $db->select("SELECT id,type,login,password FROM `users` WHERE email='".$email."'");
		if (!$result) msg::error("email - не найден!");
		
		if (!password_verify($password, $result[0]["password"])) msg::error("данные не подходят");	
		
		$_SESSION["user_id"] 	= $result[0]["id"];
		$_SESSION["user_login"] = $result[0]["login"];						

		if(!$db->query("UPDATE `users` SET last_visit=NOW() WHERE id='".$_SESSION["user_id"]."'")) msg::error("last_visit error");
	
		msg::success($result);				
	}
	
	/* --- обновить информацию --- */
	function update()
	{
		$db	= DataBase::getDB();
		if (!isset($_POST['login']) || !isset($_POST['email'])) msg::error("нет данных");
		
		$login	= (string)$_POST["login"];		
		$email	= (string)$_POST["email"];
		
		if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
			msg::error("не - email!");	
		}
 						
		$table = $db->query("UPDATE `users` SET login='".$login."', email='".$email."' WHERE id='".$_SESSION["user_id"]."'");
		msg::success($table);	
	}
	
	/* --- авторизация через VK --- */	
	function authFromVK()
	{						
		$db = DataBase::getDB();		
		
		$vk_id = (int)$_GET['vk_id'];		
		
		if (!empty($vk_id))
		{			
			$result = $db->select("SELECT id,type,login,email FROM `users` WHERE vk_id=".$vk_id);
			if ($result) 
			{
				$_SESSION["user_id"] 	= $result[0]["id"];
				$_SESSION["user_login"] = $result[0]["login"];	
				msg::success($result);
			}
			msg::error("не возможно авторизироваться");			
		}	  
	}
	
	/* --- восстановить пароль --- */
	static function restorePassword()
	{
		$db = DataBase::getDB();
		$email = (string)$_GET['email'];
		$table = $db->select("SELECT * FROM `users` WHERE email='".$email."'");		
		if (!$table) msg::warning("email не найден");

		$new_pass = uniqid();		
		$hash_password = password_hash($new_pass, PASSWORD_BCRYPT);
		
		$result = $db->query("UPDATE `users` SET password='".$hash_password."' WHERE email='".$email."'");						
		if (!$result) msg::error("невозможно установить пароль");
		
		$mail = new Mail("no-reply@my-literature.com");
		$mail->setFromName("Моя литература");

		$content = "<center>новый пароль: <b>".$new_pass."</b><br><a href=https://".$_SERVER['HTTP_HOST'].">перейти на сайт</a></center>";

		if ($mail->send($email, "Сброс пароля", $content)){
			msg::success("письмо отправлено");
		}
		msg::error("невозможно отправить письмо!");
	}
}
?>