<?php

class Text
{	
	private static $text=null;	
	
	/* --- получить класс работы с записями --- */
	public static function getText() {	
		if (self::$text== null){			
			self::$text= new Text();						
			return self::$text;
		}
	}
	
	function read()
	{
		$db = DataBase::getDB();
		$result = $db->select("SELECT * FROM records WHERE id='".$_GET["record_id"]."' LIMIT 1");
		if ($result[0]["access_mode"]==1 && $_GET["reader"]=="web") msg::error("доступ запрещён!");
		msg::success($result);
	}
}
?>